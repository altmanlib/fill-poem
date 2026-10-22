// Pointer-based drag with tap fallback. One handler covers mouse, touch and pen.

const DRAG_THRESHOLD = 6;

export interface DragHandlers {
  /** Pointer released without moving past the threshold. */
  onTap: () => void;
  /** Pointer released after a drag; coordinates are viewport-relative. */
  onDrop: (x: number, y: number) => void;
}

/** Make `el` draggable: a floating clone follows the pointer while dragging. */
export function attachDrag(el: HTMLElement, { onTap, onDrop }: DragHandlers): void {
  el.style.touchAction = 'none';

  el.addEventListener('pointerdown', (down) => {
    if (down.button !== 0 && down.pointerType === 'mouse') return;
    const startX = down.clientX;
    const startY = down.clientY;
    let ghost: HTMLElement | null = null;
    el.setPointerCapture(down.pointerId);

    const move = (e: PointerEvent): void => {
      if (!ghost && Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return;
      if (!ghost) {
        ghost = el.cloneNode(true) as HTMLElement;
        ghost.classList.add('is-ghost');
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '20';
        ghost.style.margin = '0';
        document.body.append(ghost);
      }
      ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
      ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
    };

    const end = (e: PointerEvent, cancelled: boolean): void => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      if (el.hasPointerCapture(down.pointerId)) el.releasePointerCapture(down.pointerId);
      const dragged = ghost !== null;
      ghost?.remove();
      if (cancelled) return;
      if (dragged) onDrop(e.clientX, e.clientY);
      else onTap();
    };
    const up = (e: PointerEvent): void => end(e, false);
    const cancel = (e: PointerEvent): void => end(e, true);

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
  });
}
