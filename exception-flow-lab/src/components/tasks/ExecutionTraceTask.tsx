// src/components/tasks/ExecutionTraceTask.tsx
//
// Drag + click-fallback ordering across three zones: a neutral "Events to
// sort" pool (where every card starts — so the starting layout can't be
// mistaken for an answer), "This happens, in order", and "Doesn't happen".
// No interaction here depends solely on drag-and-drop — every card has
// explicit, always-visible buttons that do the same job.
//
// Accessibility note: dnd-kit's keyboard sensor reorders reliably *within*
// one sortable list, but cross-container keyboard drag (moving a card
// between zones by keyboard alone) isn't something dnd-kit gives you for
// free. Rather than lean on that, the ▲/▼ and "move to zone" buttons below
// are the actual accessible path — they are plain, always-enabled buttons,
// fully Tab + Enter/Space operable, independent of drag support entirely.

import { useMemo, useState } from "react";
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
import { shuffledIds } from "./shuffle";
import styles from "./ExecutionTraceTask.module.css";

export interface ExecutionTraceTaskProps {
  data: ExecutionTraceData;
  onSubmit: (sequence: string[]) => void;
  disabled?: boolean;
}

type ContainerId = "pool" | "sequence" | "doesntHappen";
type Containers = Record<ContainerId, string[]>;

const CONTAINER_IDS: ContainerId[] = ["pool", "sequence", "doesntHappen"];

function isContainerId(id: string): id is ContainerId {
  return (CONTAINER_IDS as string[]).includes(id);
}

export function ExecutionTraceTask({ data, onSubmit, disabled }: ExecutionTraceTaskProps) {
  const cardMap = useMemo(() => new Map(data.cards.map((c) => [c.id, c])), [data.cards]);
  // Every card starts in the neutral pool — nothing is pre-sorted into
  // "happens" or "doesn't happen", so the initial layout can't be read as a
  // hint about the answer.
  const [containers, setContainers] = useState<Containers>(() => ({
    pool: shuffledIds(data.cards),
    sequence: [],
    doesntHappen: [],
  }));
  const [confirmed, setConfirmed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const locked = Boolean(disabled) || confirmed;

  function findContainer(id: string): ContainerId | undefined {
    return CONTAINER_IDS.find((c) => containers[c].includes(id));
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
    const overContainer: ContainerId | undefined = isContainerId(overIdStr) ? overIdStr : findContainer(overIdStr);
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
    const overContainer: ContainerId | undefined = isContainerId(overIdStr) ? overIdStr : findContainer(overIdStr);
    if (container !== overContainer) return; // cross-container move already applied in onDragOver
    setContainers((prev) => {
      const items = prev[container];
      const oldIndex = items.indexOf(activeIdStr);
      const newIndex = items.indexOf(overIdStr);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [container]: arrayMove(items, oldIndex, newIndex) };
    });
  }

  // Explicit, keyboard-and-click-only path for moving a card between the
  // three zones — appends at the end of the target zone. This is the
  // accessible equivalent of a cross-container drag (see the a11y note up
  // top), and it's how every card ever gets classified in the first place.
  function moveCard(id: string, target: ContainerId) {
    if (locked) return;
    setContainers((prev) => {
      const source = CONTAINER_IDS.find((c) => prev[c].includes(id));
      if (!source || source === target) return prev;
      const next: Containers = {
        pool: prev.pool.filter((i) => i !== id),
        sequence: prev.sequence.filter((i) => i !== id),
        doesntHappen: prev.doesntHappen.filter((i) => i !== id),
      };
      next[target] = [...next[target], id];
      return next;
    });
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

  // Every card has to be explicitly classified — nothing may be left in the
  // neutral pool — before the learner can lock in an answer.
  const allPlaced = containers.pool.length === 0;

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
            id="pool"
            title="Events to sort"
            emptyLabel="All events have been sorted below."
            items={containers.pool}
            disabled={locked}
            renderCard={(id) => (
              <Card id={id} label={cardMap.get(id)?.label ?? id} disabled={locked}>
                <div className={styles.cardControls}>
                  <button type="button" onClick={() => moveCard(id, "sequence")} disabled={locked}>
                    This happens →
                  </button>
                  <button type="button" onClick={() => moveCard(id, "doesntHappen")} disabled={locked}>
                    Doesn't happen →
                  </button>
                </div>
              </Card>
            )}
          />

          <div className={styles.destinationZones}>
            <Zone
              id="sequence"
              title="This happens, in order"
              emptyLabel="Move events here, in the order they happen."
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
                    <button type="button" onClick={() => moveCard(id, "pool")} disabled={locked}>
                      ← Back to sort
                    </button>
                    <button type="button" onClick={() => moveCard(id, "doesntHappen")} disabled={locked}>
                      Doesn't happen →
                    </button>
                  </div>
                </Card>
              )}
            />

            <Zone
              id="doesntHappen"
              title="Doesn't happen"
              emptyLabel="Move events here if they do not occur in this run."
              items={containers.doesntHappen}
              disabled={locked}
              renderCard={(id) => (
                <Card id={id} label={cardMap.get(id)?.label ?? id} disabled={locked}>
                  <div className={styles.cardControls}>
                    <button type="button" onClick={() => moveCard(id, "pool")} disabled={locked}>
                      ← Back to sort
                    </button>
                    <button type="button" onClick={() => moveCard(id, "sequence")} disabled={locked}>
                      This happens →
                    </button>
                  </div>
                </Card>
              )}
            />
          </div>
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
            Check my answer
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
