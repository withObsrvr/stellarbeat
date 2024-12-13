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
    if (event instanceof MouseEvent && event.button !== 0) return;

    if (event instanceof TouchEvent && event.touches.length === 2) {
      // Pinch-to-zoom start
      isPanning.value = false;
      initialPinchDistance = getDistance(event.touches[0], event.touches[1]);
      initialScale = scale.value;
    } else {
      // Panning start
      isPanning.value = true;
      if (event instanceof MouseEvent) {
        panStart.value = { x: event.clientX, y: event.clientY };
      } else if (event instanceof TouchEvent && event.touches.length === 1) {
        const touch = event.touches[0];
        panStart.value = { x: touch.clientX, y: touch.clientY };
      }
      translateStart.value = { x: translateX.value, y: translateY.value };
    }
  }

  function pan(event: MouseEvent | TouchEvent) {
    if (event instanceof TouchEvent && event.touches.length === 2) {
      // Pinch-to-zoom move
      const currentDistance = getDistance(event.touches[0], event.touches[1]);
      const scaleFactor = currentDistance / initialPinchDistance;
      scale.value = Math.min(Math.max(0.5, initialScale * scaleFactor), 5);
    } else if (isPanning.value) {
      // Panning move
      let currentX = 0;
      let currentY = 0;

      if (event instanceof MouseEvent) {
        currentX = event.clientX;
        currentY = event.clientY;
      } else if (event instanceof TouchEvent && event.touches.length === 1) {
        const touch = event.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;
      } else {
        return;
      }

      const dx = currentX - panStart.value.x;
      const dy = currentY - panStart.value.y;

      translateX.value = translateStart.value.x + dx;
      translateY.value = translateStart.value.y + dy;
    }
  }

  function endPan() {
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
