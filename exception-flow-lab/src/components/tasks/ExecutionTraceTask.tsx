// src/components/tasks/ExecutionTraceTask.tsx
//
// The highest-risk component per the build spec's build order: drag +
// click-fallback ordering, plus the "doesn't happen" skip-detection zone
// (spec §8). No interaction here depends solely on drag-and-drop — every
// card has explicit, always-visible buttons that do the same job.
//
// Accessibility note: dnd-kit's keyboard sensor reorders reliably *within*
// one sortable list, but cross-container keyboard drag (moving a card
// between "happens" and "doesn't happen" by keyboard alone) isn't something
// dnd-kit gives you for free. Rather than lean on that, the ▲/▼ and
// "move to other zone" buttons below are the actual accessible path — they
// are plain, always-enabled buttons, fully Tab + Enter/Space operable,
// independent of drag support entirely.

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ExecutionTraceData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import styles from "./ExecutionTraceTask.module.css";

export interface ExecutionTraceTaskProps {
  data: ExecutionTraceData;
  onSubmit: (sequence: string[]) => void;
  disabled?: boolean;
}

type ContainerId = "sequence" | "doesntHappen";
type Containers = Record<ContainerId, string[]>;

function shuffledIds(cards: { id: string }[]): string[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function ExecutionTraceTask({ data, onSubmit, disabled }: ExecutionTraceTaskProps) {
  const cardMap = new Map(data.cards.map((c) => [c.id, c]));
  const [containers, setContainers] = useState<Containers>(() => ({
    sequence: [],
    doesntHappen: shuffledIds(data.cards),
  }));
  const [confirmed, setConfirmed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const locked = Boolean(disabled) || confirmed;

  function findContainer(id: string): ContainerId | undefined {
    if (containers.sequence.includes(id)) return "sequence";
    if (containers.doesntHappen.includes(id)) return "doesntHappen";
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeContainer = findContainer(activeIdStr);
    const overContainer: ContainerId | undefined =
      overIdStr === "sequence" || overIdStr === "doesntHappen" ? (overIdStr as ContainerId) : findContainer(overIdStr);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setContainers((prev) => {
      const activeItems = prev[activeContainer].filter((id) => id !== activeIdStr);
      const overItems = [...prev[overContainer]];
      const overIndex = overItems.indexOf(overIdStr);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(insertAt, 0, activeIdStr);
      return { ...prev, [activeContainer]: activeItems, [overContainer]: overItems };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const container = findContainer(activeIdStr);
    if (!container) return;
    const overContainer: ContainerId | undefined =
      overIdStr === "sequence" || overIdStr === "doesntHappen" ? (overIdStr as ContainerId) : findContainer(overIdStr);
    if (container !== overContainer) return; // cross-container move already applied in onDragOver
    setContainers((prev) => {
      const items = prev[container];
      const oldIndex = items.indexOf(activeIdStr);
      const newIndex = items.indexOf(overIdStr);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [container]: arrayMove(items, oldIndex, newIndex) };
    });
  }

  function moveToSequence(id: string) {
    if (locked) return;
    setContainers((prev) => ({
      sequence: [...prev.sequence, id],
      doesntHappen: prev.doesntHappen.filter((i) => i !== id),
    }));
  }

  function moveToDoesntHappen(id: string) {
    if (locked) return;
    setContainers((prev) => ({
      sequence: prev.sequence.filter((i) => i !== id),
      doesntHappen: [...prev.doesntHappen, id],
    }));
  }

  function moveWithinSequence(id: string, direction: -1 | 1) {
    if (locked) return;
    setContainers((prev) => {
      const items = [...prev.sequence];
      const index = items.indexOf(id);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= items.length) return prev;
      return { ...prev, sequence: arrayMove(items, index, newIndex) };
    });
  }

  const allPlaced = containers.sequence.length + containers.doesntHappen.length === data.cards.length;

  return (
    <div className={styles.wrapper}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.zones}>
          <Zone
            id="sequence"
            title="This happens, in order"
            emptyLabel="Drag events here, in the order they happen — or use “This happens” on a card."
            items={containers.sequence}
            disabled={locked}
            renderCard={(id, index) => (
              <Card id={id} label={cardMap.get(id)?.label ?? id} disabled={locked}>
                <div className={styles.cardControls}>
                  <span className={styles.stepIndex} aria-hidden="true">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveWithinSequence(id, -1)}
                    disabled={locked || index === 0}
                    aria-label="Move earlier in the sequence"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWithinSequence(id, 1)}
                    disabled={locked || index === containers.sequence.length - 1}
                    aria-label="Move later in the sequence"
                  >
                    ▼
                  </button>
                  <button type="button" onClick={() => moveToDoesntHappen(id)} disabled={locked}>
                    Doesn't happen →
                  </button>
                </div>
              </Card>
            )}
          />

          <Zone
            id="doesntHappen"
            title="Doesn't happen"
            emptyLabel="Nothing here."
            items={containers.doesntHappen}
            disabled={locked}
            renderCard={(id) => (
              <Card id={id} label={cardMap.get(id)?.label ?? id} disabled={locked}>
                <div className={styles.cardControls}>
                  <button type="button" onClick={() => moveToSequence(id)} disabled={locked}>
                    ← This happens
                  </button>
                </div>
              </Card>
            )}
          />
        </div>

        <DragOverlay>
          {activeId ? <div className={styles.dragPreview}>{cardMap.get(activeId)?.label}</div> : null}
        </DragOverlay>
      </DndContext>

      <div className={styles.actions}>
        {!confirmed ? (
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!allPlaced || disabled}
            onClick={() => setConfirmed(true)}
          >
            This is my order
          </button>
        ) : (
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => setConfirmed(false)} disabled={disabled}>
              Edit my order
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => onSubmit(containers.sequence)} disabled={disabled}>
              Submit answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Internal building blocks ---

interface ZoneProps {
  id: ContainerId;
  title: string;
  emptyLabel: string;
  items: string[];
  disabled: boolean;
  renderCard: (id: string, index: number) => React.ReactNode;
}

function Zone({ id, title, emptyLabel, items, renderCard }: ZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className={styles.zone}>
      <h3 className={styles.zoneTitle}>{title}</h3>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={[styles.zoneBody, isOver ? styles.zoneBodyOver : ""].join(" ")}>
          {items.length === 0 && <p className={styles.emptyLabel}>{emptyLabel}</p>}
          {items.map((cardId, index) => (
            <div key={cardId}>{renderCard(cardId, index)}</div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface CardProps {
  id: string;
  label: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

function Card({ id, label, disabled, children }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={styles.card}>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`Drag ${label}`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <span className={styles.cardLabel}>
        <InlineCode text={label} />
      </span>
      {children}
    </div>
  );
}
