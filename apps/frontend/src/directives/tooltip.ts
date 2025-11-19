// Vue 3 directive for Bootstrap tooltips
import $ from "jquery";
import type { DirectiveBinding } from "vue";
import Tooltip from "bootstrap/js/dist/tooltip";

type PopoverPlacement = Tooltip.PopoverPlacement;

export default {
  // Vue 3: 'inserted' hook renamed to 'mounted'
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    let placement: PopoverPlacement = "top";
    if (!binding.value) return;

    if (
      binding.arg &&
      ["auto", "top", "left", "right", "bottom"].includes(binding.arg)
    ) {
      placement = binding.arg as PopoverPlacement;
    } else {
      if (binding.arg !== undefined)
        throw new Error("Invalid placement: " + binding.arg);
    }
    $(el).tooltip({
      title: binding.value,
      placement: placement,
      trigger: "hover",
    });
  },
  // Vue 3: 'unbind' hook renamed to 'unmounted'
  unmounted(el: HTMLElement) {
    $(el).tooltip("dispose");
  },
};
