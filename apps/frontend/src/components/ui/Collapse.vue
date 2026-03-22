<template>
  <Transition
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <div v-show="modelValue" :id="id">
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: boolean;
  id?: string;
}>();

function beforeEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '0';
  htmlEl.style.overflow = 'hidden';
}

function enter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = 'height 0.3s ease';
  htmlEl.style.height = htmlEl.scrollHeight + 'px';
  htmlEl.addEventListener('transitionend', done, { once: true });
}

function afterEnter(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '';
  htmlEl.style.overflow = '';
  htmlEl.style.transition = '';
}

function beforeLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = htmlEl.scrollHeight + 'px';
  htmlEl.style.overflow = 'hidden';
}

function leave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.transition = 'height 0.3s ease';
  // Force reflow
  void htmlEl.offsetHeight;
  htmlEl.style.height = '0';
  htmlEl.addEventListener('transitionend', done, { once: true });
}

function afterLeave(el: Element) {
  const htmlEl = el as HTMLElement;
  htmlEl.style.height = '';
  htmlEl.style.overflow = '';
  htmlEl.style.transition = '';
}
</script>
