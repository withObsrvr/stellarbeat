// Vue 3 directive for native tooltips (no jQuery/Bootstrap dependency)
import type { DirectiveBinding } from "vue";

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    if (!binding.value) return;
    el.setAttribute("title", binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    if (!binding.value) {
      el.removeAttribute("title");
    } else {
      el.setAttribute("title", binding.value);
    }
  },
  unmounted(el: HTMLElement) {
    el.removeAttribute("title");
  },
};
