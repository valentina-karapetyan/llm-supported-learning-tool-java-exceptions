// src/components/tasks/CatchOrderTask.tsx
//
// Reorder a single list of catch clauses, most-specific first. Simpler than
// ExecutionTraceTask — one list, no "doesn't happen" zone — but the same
// drag + always-visible ▲/▼ button pattern, so no interaction depends
// solely on drag-and-drop.

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import type { CatchOrderData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import { shuffledIdsAvoiding } from "./shuffle";
import styles from "./CatchOrderTask.module.css";

export interface CatchOrderTaskProps {
  data: CatchOrderData;
  onSubmit: (order: string[]) => void;
  disabled?: boolean;
}

export function CatchOrderTask({ data, onSubmit, disabled }: CatchOrderTaskProps) {
  const clauseMap = useMemo(() => new Map(data.clauses.map((c) => [c.id, c])), [data.clauses]);
  // Shuffled on mount (and reshuffled on any later remount, e.g. a retry)
  // rather than shown in authored order — content authors shouldn't have to
  // remember to scramble `clauses` themselves, a learner shouldn't be able
  // to infer anything from the initial order, and it must never start
  // already correctly ordered, which would hand over the answer for free.
  const [order, setOrder] = useState<string[]>(() => shuffledIdsAvoiding(data.clauses, data.correctOrder));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function move(id: string, direction: -1 | 1) {
    if (disabled) return;
    setOrder((prev) => {
      const index = prev.indexOf(id);
      // Guard index === -1 explicitly (mirrors handleDragEnd below) — without
      // it, an id no longer in `prev` silently resolves to newIndex 0 and
      // arrayMove treats an id-not-found -1 as "from the end", splicing out
      // an unrelated clause instead of no-op'ing.
      if (index === -1) return prev;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      return arrayMove(prev, index, newIndex);
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
    <div className={styles.wrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ol className={styles.list}>
            {order.map((id, index) => (
              <ClauseCard
                key={id}
                id={id}
                label={clauseMap.get(id)?.label ?? id}
                index={index}
                total={order.length}
                disabled={disabled}
                onMove={move}
              />
            ))}
          </ol>
        </SortableContext>
        <DragOverlay>{activeId ? <div className={styles.dragPreview}>{clauseMap.get(activeId)?.label}</div> : null}</DragOverlay>
      </DndContext>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={() => onSubmit(order)} disabled={disabled}>
          Submit answer
        </button>
      </div>
    </div>
  );
}

interface ClauseCardProps {
  id: string;
  label: string;
  index: number;
  total: number;
  disabled?: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
}

function ClauseCard({ id, label, index, total, disabled, onMove }: ClauseCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <li ref={setNodeRef} style={style} className={styles.card}>
      <span className={styles.rank} aria-hidden="true">
        {index + 1}
      </span>
      <button type="button" className={styles.dragHandle} aria-label={`Drag ${label}`} disabled={disabled} {...attributes} {...listeners}>
        ⠿
      </button>
      <span className={styles.cardLabel}>
        <InlineCode text={label} />
      </span>
      <div className={styles.cardControls}>
        <button type="button" onClick={() => onMove(id, -1)} disabled={disabled || index === 0} aria-label="Move earlier">
          ▲
        </button>
        <button type="button" onClick={() => onMove(id, 1)} disabled={disabled || index === total - 1} aria-label="Move later">
          ▼
        </button>
      </div>
    </li>
  );
}
