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

  function startPan(event: MouseEvent | TouchEvent) {
    if (event instanceof MouseEvent && event.button !== 0) return;

    isPanning.value = true;

    if (event instanceof MouseEvent) {
      panStart.value = { x: event.clientX, y: event.clientY };
    } else if (event instanceof TouchEvent) {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        panStart.value = { x: touch.clientX, y: touch.clientY };
      }
    }

    translateStart.value = { x: translateX.value, y: translateY.value };
  }

  function pan(event: MouseEvent | TouchEvent) {
    if (!isPanning.value) return;

    let currentX = 0;
    let currentY = 0;

    if (event instanceof MouseEvent) {
      currentX = event.clientX;
      currentY = event.clientY;
    } else if (event instanceof TouchEvent) {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;
      }
    }

    const dx = currentX - panStart.value.x;
    const dy = currentY - panStart.value.y;

    translateX.value = translateStart.value.x + dx;
    translateY.value = translateStart.value.y + dy;
  }

  function endPan() {
    isPanning.value = false;
  }

  function zoom(event: WheelEvent) {
    const zoomIntensity = 0.001;
    const delta = event.deltaY;

    const newScale = scale.value - delta * zoomIntensity;
    scale.value = Math.min(Math.max(0.1, newScale), 10);
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
