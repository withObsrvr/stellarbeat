import App from "./App.vue";
import { createApp } from "vue";
import { createRouter } from "./router";
import "./assets/tailwind.css";
import "./assets/custom.scss";
import "./assets/global.css";
import Multiselect from "vue-multiselect";
import * as Sentry from "@sentry/vue";
import ToolTipDirective from "./directives/tooltip";
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

// Register Tailwind-based UI components globally
app.component("UiBadge", Badge);
app.component("UiAlert", Alert);
app.component("UiCard", Card);
app.component("UiButton", Button);
app.component("UiIcon", Icon);
app.component("UiFormInput", FormInput);
app.component("UiFormTextarea", FormTextarea);
app.component("UiFormSelect", FormSelect);
app.component("UiFormCheckbox", FormCheckbox);
app.component("UiFormGroup", FormGroup);
app.component("UiFormRadio", FormRadio);
app.component("UiFormRadioGroup", FormRadioGroup);
app.component("UiListGroup", ListGroup);
app.component("UiListGroupItem", ListGroupItem);
app.component("UiCollapse", Collapse);
app.component("UiPagination", Pagination);
app.component("UiDropdown", Dropdown);
app.component("UiDropdownItem", DropdownItem);
app.component("UiDropdownItemButton", DropdownItemButton);
app.component("UiDropdownHeader", DropdownHeader);
app.component("UiDropdownText", DropdownText);
app.component("UiDropdownDivider", DropdownDivider);
app.component("UiDropdownForm", DropdownForm);
app.component("UiModal", Modal);
app.component("UiTable", Table);
app.component("UiTabBar", TabBar);
app.component("UiDetailRow", DetailRow);
app.component("UiCopyButton", CopyButton);
app.component("UiStatusDot", StatusDot);
app.directive("tooltip", ToolTipDirective);

app.use(router);
app.mount("#app");
