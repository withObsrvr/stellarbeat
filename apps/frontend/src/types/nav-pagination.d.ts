// Type augmentation for NavPagination component to fix v-model type checking
import { DefineComponent } from 'vue';

declare module '@/components/side-bar/nav-pagination.vue' {
  const component: DefineComponent<{
    modelValue?: number;
    value?: number; // Add value as optional to satisfy vue-tsc template compiler
    totalRows: number;
  }>;
  export default component;
}
