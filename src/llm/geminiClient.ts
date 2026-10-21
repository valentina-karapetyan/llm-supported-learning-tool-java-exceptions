// src/llm/geminiClient.ts
//
// Thin, shared wrapper around the Gemini API's generateContent endpoint.
// Both llmSupportService.ts and retrievalComparisonService.ts call through
// this one module instead of each hand-rolling a fetch — one place that
// knows the request/response shape, the API key lookup, and the model name.
//
// Two ways to reach Gemini, picked once at page load:
//
//   - direct: VITE_GEMINI_API_KEY is set (local `npm run dev` via
//     .env.local). Calls Gemini straight from the browser. SECURITY: Vite
//     inlines that key into the client bundle, so it must never be set on a
//     public deployment — that's what the proxy mode is for.
//   - proxy: no VITE_ key, but the learner has an access code (from a
//     ?code=... link, remembered in localStorage). Calls the /api/gemini
//     Vercel function, which holds the real key server-side and checks the
//     code. See api/gemini.ts.
//
// With neither, every LLM-backed feature stays on its mock/placeholder
// behavior — same as before either mode existed.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";
const PROXY_ENDPOINT = "/api/gemini";
const ACCESS_CODE_STORAGE_KEY = "exception-flow-lab-access-code";

// Reads ?code=... from the URL on first load, remembers it, and strips it
// from the address bar (so a screenshot or a copied URL doesn't carry it
// along by accident). Storage can throw or be empty (private window,
// blocked site data) — then the code still works for this page load.
function readAccessCode(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get("code")?.trim();
  if (fromUrl) {
    try {
      window.localStorage.setItem(ACCESS_CODE_STORAGE_KEY, fromUrl);
    } catch {
      // Not persisted — fine for this session.
    }
    url.searchParams.delete("code");
    window.history.replaceState(window.history.state, "", url.toString());
    return fromUrl;
  }
  try {
    return window.localStorage.getItem(ACCESS_CODE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function forgetAccessCode(): void {
  try {
    window.localStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  } catch {
    // Nothing stored to forget.
  }
}

const ACCESS_CODE = API_KEY ? undefined : readAccessCode();

export function isGeminiConfigured(): boolean {
  return Boolean(API_KEY || ACCESS_CODE);
}

interface GenerateContentOptions {
  // System-level instructions the model must follow — this is where every
  // caller pins the model to the authored ground truth (task supportContent,
  // or a RetrievalQuestion's referenceAnswer/requiredConcepts) so it can
  // rephrase and explain but never invent correctness criteria of its own.
  systemInstruction: string;
  prompt: string;
  // When set, the response is constrained to JSON matching this schema
  // (Gemini's structured output) instead of free text.
  responseSchema?: object;
  // Every caller wants short, concise output here (a hint, a step-by-step
  // walkthrough, a compact JSON comparison) — never a long essay — so this
  // defaults low rather than to whatever the model would otherwise pick.
  maxOutputTokens?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The free tier's flash models routinely return a transient 503 ("high
// demand") or 429 (rate limit) under normal, non-abusive use — retrying a
// couple of times with a short backoff clears most of these without the
// caller ever seeing them, before falling back to mock/placeholder content.
// A request that hangs entirely (no response either way) is treated the
// same way: aborted after REQUEST_TIMEOUT_MS and retried on the same
// schedule, rather than left to wait indefinitely.
const TRANSIENT_STATUS_CODES = new Set([429, 503]);
// Only used when the server doesn't tell us how long to wait (503, or a 429
// with no parseable RetryInfo) — confirmed live that a real 429's own
// RetryInfo.retryDelay (parsed below) is regularly several seconds, well
// past this fixed schedule, so honoring it when present is what actually
// clears a rate-limit hit instead of retrying straight into the same 429.
const RETRY_DELAYS_MS = [500, 1500];
// Cap on how long we'll actually wait even if the server asks for more —
// keeps a caught-in-a-burst request failing fast (to the existing
// retry/placeholder UI) rather than leaving "Checking…" spinning too long.
const MAX_SERVER_RETRY_DELAY_MS = 10000;
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_MAX_OUTPUT_TOKENS = 500;

// Gemini's 429 body includes a RetryInfo detail like
// `{"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "6s"}`
// (fractional seconds too, e.g. "6.827074564s") — this is Google's own
// measurement of how long the current quota window has left, so it's a far
// better retry delay than any fixed guess. Returns undefined for anything
// that isn't this exact shape (a 503 body, a network-level failure, or a 429
// without RetryInfo) so the caller falls back to RETRY_DELAYS_MS.
function parseRetryDelayMs(errorBodyText: string): number | undefined {
  try {
    const details = JSON.parse(errorBodyText)?.error?.details;
    if (!Array.isArray(details)) return undefined;
    for (const detail of details) {
      const match = typeof detail?.retryDelay === "string" ? detail.retryDelay.match(/^([\d.]+)s$/) : null;
      if (match) return Math.ceil(parseFloat(match[1]) * 1000);
    }
  } catch {
    // Not JSON, or not the shape we expect — fall back to the fixed schedule.
  }
  return undefined;
}

async function generateContent({
  systemInstruction,
  prompt,
  responseSchema,
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
}: GenerateContentOptions): Promise<string> {
  let endpoint: string;
  let headers: Record<string, string>;
  let body: string;
  if (API_KEY) {
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens,
        // gemini-3.6-flash "thinks" before answering by default, and those
        // reasoning tokens are billed against the SAME maxOutputTokens budget
        // as the actual answer — confirmed live: a 400-token budget on the
        // retrieval-comparison prompt spent 380 tokens on invisible thinking
        // and left only `{\n  "` of the real JSON, hitting MAX_TOKENS and
        // failing JSON.parse every time. None of this app's prompts need
        // multi-step reasoning (a hint, a short explanation, a bounded
        // classification) — disabling thinking makes the budget above go
        // entirely to the actual answer, and is also faster/cheaper.
        // api/gemini.ts builds the same generationConfig server-side.
        thinkingConfig: { thinkingBudget: 0 },
        ...(responseSchema ? { responseMimeType: "application/json", responseSchema } : {}),
      },
    });
  } else if (ACCESS_CODE) {
    // The proxy builds the Gemini request itself (model, generationConfig),
    // so it only needs the parts that vary per call.
    endpoint = PROXY_ENDPOINT;
    headers = { "Content-Type": "application/json", "x-access-code": ACCESS_CODE };
    body = JSON.stringify({ systemInstruction, prompt, responseSchema, maxOutputTokens });
  } else {
    throw new Error("Gemini is not configured (no VITE_GEMINI_API_KEY and no access code)");
  }

  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
        signal: timeoutController.signal,
      });
    } catch (err) {
      lastError =
        err instanceof Error && err.name === "AbortError"
          ? new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`)
          : err instanceof Error
            ? err
            : new Error(String(err));
      if (attempt === RETRY_DELAYS_MS.length) throw lastError;
      await delay(RETRY_DELAYS_MS[attempt]);
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        // A response truncated by hitting maxOutputTokens (finishReason
        // "MAX_TOKENS") can also land here with no usable text — not
        // retried, same as a safety-filtered response: the fix is a smaller
        // ask or a larger budget, not trying the exact same request again.
        throw new Error("Gemini response had no text content (possibly blocked by safety filters, or truncated by the token limit)");
      }
      return text;
    }

    const errorBodyText = await response.text();
    // The proxy rejected the stored code (mistyped, or revoked by removing
    // it from ACCESS_CODES) — forget it, so from the next page load on this
    // browser is back on mock/placeholder behavior instead of failing every
    // request. Not retried: the same code won't start working.
    if (ACCESS_CODE && response.status === 401) forgetAccessCode();
    lastError = new Error(`Gemini request failed (${response.status}): ${errorBodyText}`);
    if (!TRANSIENT_STATUS_CODES.has(response.status) || attempt === RETRY_DELAYS_MS.length) {
      throw lastError;
    }
    const serverDelayMs = parseRetryDelayMs(errorBodyText);
    await delay(serverDelayMs !== undefined ? Math.min(serverDelayMs, MAX_SERVER_RETRY_DELAY_MS) : RETRY_DELAYS_MS[attempt]);
  }
  throw lastError;
}

export async function generateText(systemInstruction: string, prompt: string, maxOutputTokens?: number): Promise<string> {
  return generateContent({ systemInstruction, prompt, maxOutputTokens });
}

export async function generateJson<T>(
  systemInstruction: string,
  prompt: string,
  responseSchema: object,
  maxOutputTokens?: number
): Promise<T> {
  const text = await generateContent({ systemInstruction, prompt, responseSchema, maxOutputTokens });
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Gemini returned malformed JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}
