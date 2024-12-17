import { ref } from "vue";

interface Position {
  x: number;
  y: number;
}

export function usePanning() {
  const translateX = ref(0);
  const translateY = ref(0);
  const scale = ref(1);

  const isPanning = ref(false);
  const panStart = ref<Position>({ x: 0, y: 0 });
  const translateStart = ref<Position>({ x: 0, y: 0 });

  let initialPinchDistance = 0;
  let initialScale = 1;

  function startPan(event: MouseEvent | TouchEvent) {
    if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
      if (event.touches.length === 2) {
        // Pinch-to-zoom start
        isPanning.value = false;
        initialPinchDistance = getDistance(event.touches[0], event.touches[1]);
        initialScale = scale.value;
      } else if (event.touches.length === 1) {
        // Touch panning start
        isPanning.value = true;
        const touch = event.touches[0];
        panStart.value = { x: touch.clientX, y: touch.clientY };
        translateStart.value = { x: translateX.value, y: translateY.value };
      }
    } else if (
      typeof MouseEvent !== "undefined" &&
      event instanceof MouseEvent
    ) {
      if (event.button !== 0) return; // Only allow left mouse button
      isPanning.value = true;
      panStart.value = { x: event.clientX, y: event.clientY };
      translateStart.value = { x: translateX.value, y: translateY.value };
    }
  }

  function pan(event: MouseEvent | TouchEvent) {
    if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
      if (event.touches.length === 2) {
        // Pinch-to-zoom move
        const currentDistance = getDistance(event.touches[0], event.touches[1]);
        const scaleFactor = currentDistance / initialPinchDistance;
        scale.value = Math.min(Math.max(0.5, initialScale * scaleFactor), 5);
      } else if (isPanning.value && event.touches.length === 1) {
        // Touch panning
        const touch = event.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;

        const dx = currentX - panStart.value.x;
        const dy = currentY - panStart.value.y;

        translateX.value = translateStart.value.x + dx;
        translateY.value = translateStart.value.y + dy;
      }
    } else if (
      isPanning.value &&
      typeof MouseEvent !== "undefined" &&
      event instanceof MouseEvent
    ) {
      // Mouse panning
      const currentX = event.clientX;
      const currentY = event.clientY;

      const dx = currentX - panStart.value.x;
      const dy = currentY - panStart.value.y;

      translateX.value = translateStart.value.x + dx;
      translateY.value = translateStart.value.y + dy;
    }
  }

  function endPan(event: MouseEvent | TouchEvent) {
    isPanning.value = false;
  }

  function zoom(event: WheelEvent) {
    const zoomIntensity = 0.001;
    const delta = event.deltaY;

    const newScale = scale.value - delta * zoomIntensity;
    scale.value = Math.min(Math.max(0.5, newScale), 5);
  }

  function getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  return {
    translateX,
    translateY,
    scale,
    isPanning,
    startPan,
    pan,
    endPan,
    zoom,
  };
}
