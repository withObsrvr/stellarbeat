import App from "./App.vue";
import { createApp } from "vue";
import { createRouter } from "./router";
import "./assets/tailwind.css";
import "./assets/custom.scss";
import "./assets/global.css";
import Multiselect from "vue-multiselect";
import * as Sentry from "@sentry/vue";
import ToolTipDirective from "./directives/tooltip";
// Temporary: Bootstrap JS still needed by network-analysis.vue (v-b-toggle accordion)
import "bootstrap/js/dist/collapse";
// Temporary: re-register bootstrap-compat components still used by network-analysis.vue and history-card.vue
import bootstrapCompat from './components/bootstrap-compat';
// Import new Tailwind-based UI components
import {
  Badge, Alert, Card, Button, Icon,
  FormInput, FormTextarea, FormSelect, FormCheckbox, FormGroup,
  FormRadio, FormRadioGroup,
  ListGroup, ListGroupItem, Collapse, Pagination,
  Dropdown, DropdownItem, DropdownItemButton, DropdownHeader,
  DropdownText, DropdownDivider, DropdownForm,
  Modal, Table,
  TabBar, DetailRow, CopyButton, StatusDot,
} from './components/ui';

//@ts-ignore
window.global ||= window;

const isProd = import.meta.env.PROD;

const app = createApp(App);
const router = createRouter();

if (isProd) {
  Sentry.init({
    app,
    dsn: import.meta.env.VUE_APP_SENTRY_DSN,
  });
}

app.component("MultiSelect", Multiselect);

// Register Tailwind-based UI components globally with UI prefix
app.component("UiBadge", Badge);
app.component("UiAlert", Alert);
app.component("UiCard", Card);
app.component("UiButton", Button);
app.component("UiIcon", Icon);
// Form components
app.component("UiFormInput", FormInput);
app.component("UiFormTextarea", FormTextarea);
app.component("UiFormSelect", FormSelect);
app.component("UiFormCheckbox", FormCheckbox);
app.component("UiFormGroup", FormGroup);
app.component("UiFormRadio", FormRadio);
app.component("UiFormRadioGroup", FormRadioGroup);
// Display components
app.component("UiListGroup", ListGroup);
app.component("UiListGroupItem", ListGroupItem);
app.component("UiCollapse", Collapse);
app.component("UiPagination", Pagination);
// Dropdown system
app.component("UiDropdown", Dropdown);
app.component("UiDropdownItem", DropdownItem);
app.component("UiDropdownItemButton", DropdownItemButton);
app.component("UiDropdownHeader", DropdownHeader);
app.component("UiDropdownText", DropdownText);
app.component("UiDropdownDivider", DropdownDivider);
app.component("UiDropdownForm", DropdownForm);
// Complex components
app.component("UiModal", Modal);
app.component("UiTable", Table);
// Prism design system components
app.component("UiTabBar", TabBar);
app.component("UiDetailRow", DetailRow);
app.component("UiCopyButton", CopyButton);
app.component("UiStatusDot", StatusDot);
app.directive("tooltip", ToolTipDirective);

// Temporary: register remaining bootstrap-compat components for network-analysis.vue and history-card.vue
// TODO: Remove once these files are fully migrated
Object.entries(bootstrapCompat).forEach(([name, component]) => {
  if (name === 'VBModal') {
    app.directive('b-modal', component);
  } else if (name === 'VBToggle') {
    app.directive('b-toggle', component);
  } else {
    // @ts-expect-error
    app.component(name, component);
  }
});

app.use(router);
app.mount("#app");
