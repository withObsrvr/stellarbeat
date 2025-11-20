// Type augmentation for nodes-table component to allow mixed string/object field arrays
import { DefineComponent } from 'vue';
import { TableNode } from '@/components/node/nodes-table.vue';

// Allow BvTableFieldArray to be either string[] or mixed array
type BvTableField = string | { key: string; label: string };
type BvTableFieldArray = BvTableField[];

declare module '@/components/node/nodes-table.vue' {
  export { TableNode };
  const component: DefineComponent<{
    nodes: TableNode[];
    fields?: BvTableFieldArray;
  }>;
  export default component;
}
