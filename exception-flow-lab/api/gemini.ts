// api/gemini.ts
//
// Vercel serverless function: the server-side proxy src/llm/geminiClient.ts
// calls in a deployed build, so the Gemini API key never reaches the client
// bundle. Configured entirely through Vercel environment variables (none of
// them VITE_-prefixed, so Vite never inlines them):
//
//   GEMINI_API_KEY  required. Without it every request gets a 503 and the
//                   app keeps its mock/placeholder behavior.
//   ACCESS_CODES    required. Comma-separated list of codes a tester can put
//                   in the link (?code=...). One code per tester/group means
//                   one can be revoked without breaking the others. Without
//                   any configured code every request is rejected, so a
//                   forgotten variable fails closed rather than open.
//   GEMINI_MODEL    optional, defaults to gemini-3.6-flash.
//
// Gemini's status code and body are passed through unchanged, so the
// client's retry handling (429/503, RetryInfo parsing) works exactly as it
// does when calling Gemini directly.

// No @types/node in this project, and only process.env is needed here.
declare const process: { env: Record<string, string | undefined> };

const DEFAULT_MODEL = "gemini-3.6-flash";
// Every prompt this app sends is a few KB of authored task content plus the
// learner's answer, and every caller asks for at most a few hundred tokens.
// These caps keep a valid access code from turning the proxy into a general-
// purpose Gemini endpoint with arbitrarily large requests.
const MAX_REQUEST_BYTES = 32_000;
const MAX_OUTPUT_TOKENS_CAP = 1000;

interface ProxyRequestBody {
  systemInstruction: string;
  prompt: string;
  responseSchema?: object;
  maxOutputTokens: number;
}

function jsonError(status: number, message: string): Response {
  return Response.json({ error: { message } }, { status });
}

// Constant-time comparison, so response timing doesn't leak how much of a
// guessed code matched.
function codesMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAllowedCode(code: string | null): boolean {
  if (!code) return false;
  const allowed = (process.env.ACCESS_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  // Checks every allowed code (no early return) for the same timing reason.
  let match = false;
  for (const candidate of allowed) if (codesMatch(code, candidate)) match = true;
  return match;
}

function parseBody(raw: unknown): ProxyRequestBody | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const { systemInstruction, prompt, responseSchema, maxOutputTokens } = raw as Record<string, unknown>;
  if (typeof systemInstruction !== "string" || typeof prompt !== "string") return undefined;
  if (responseSchema !== undefined && (typeof responseSchema !== "object" || responseSchema === null)) return undefined;
  if (typeof maxOutputTokens !== "number" || !Number.isFinite(maxOutputTokens) || maxOutputTokens <= 0) return undefined;
  return {
    systemInstruction,
    prompt,
    responseSchema: responseSchema as object | undefined,
    maxOutputTokens: Math.min(Math.floor(maxOutputTokens), MAX_OUTPUT_TOKENS_CAP),
  };
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonError(503, "AI features are not configured on this deployment");

  if (!isAllowedCode(request.headers.get("x-access-code"))) {
    return jsonError(401, "Missing or invalid access code");
  }

  const rawText = await request.text();
  if (rawText.length > MAX_REQUEST_BYTES) return jsonError(413, "Request too large");

  let body: ProxyRequestBody | undefined;
  try {
    body = parseBody(JSON.parse(rawText));
  } catch {
    body = undefined;
  }
  if (!body) return jsonError(400, "Malformed request");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    // Header rather than ?key=, so the key never shows up in a logged URL.
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: body.systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: body.prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: body.maxOutputTokens,
        // See the matching comment in src/llm/geminiClient.ts: thinking
        // tokens count against maxOutputTokens and none of these prompts
        // need them.
        thinkingConfig: { thinkingBudget: 0 },
        ...(body.responseSchema ? { responseMimeType: "application/json", responseSchema: body.responseSchema } : {}),
      },
    }),
  });

  return new Response(await geminiResponse.text(), {
    status: geminiResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}
