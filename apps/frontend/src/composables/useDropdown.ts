import { ref, computed, Ref } from "vue";

export function useDropdown(
  expandProp: Ref<boolean>,
  emit: (event: "toggleExpand", ...args: unknown[]) => void,
) {
  const currentPage = ref(1);
  const perPage = ref(10);

  // Use computed to make showing reactive to the prop
  const showing = computed(() => {
    return expandProp.value;
  });

  function paginate<T>(items: T[]): T[] {
    return items.slice(
      (currentPage.value - 1) * perPage.value,
      currentPage.value * perPage.value,
    );
  }

  function toggleShow(): void {
    emit("toggleExpand");
  }

  return {
    currentPage,
    perPage,
    showing,
    paginate,
    toggleShow,
  };
}
