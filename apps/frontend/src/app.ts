import App from "./App.vue";
import { createApp } from "vue";
import { createRouter } from "./router";
import "./assets/tailwind.css";
import "./assets/custom.scss";
import "./assets/global.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Multiselect from "vue-multiselect";
import * as Sentry from "@sentry/vue";
import "popper.js";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import "bootstrap/js/dist/tooltip";
import "bootstrap/js/dist/modal";
import ToolTipDirective from "./directives/tooltip";
// Import new Tailwind-based UI components
import Badge from './components/ui/Badge.vue';
import Alert from './components/ui/Alert.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Icon from './components/ui/Icon.vue';
// Import Bootstrap-Vue compatibility components
import bootstrapCompat from './components/bootstrap-compat';

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

// Register Bootstrap-Vue compatibility components and directives globally
Object.entries(bootstrapCompat).forEach(([name, component]) => {
  // Register directives separately
  if (name === 'VBModal') {
    app.directive('b-modal', component);
  } else if (name === 'VBToggle') {
    app.directive('b-toggle', component);
  } else {
    // Register as component
    // @ts-expect-error - Bootstrap compat components have complex union types that TypeScript can't properly narrow
    app.component(name, component);
  }
});

// Register new Tailwind-based UI components globally with UI prefix to avoid HTML conflicts
app.component("UiBadge", Badge);
app.component("UiAlert", Alert);
app.component("UiCard", Card);
app.component("UiButton", Button);
app.component("UiIcon", Icon);
app.directive("tooltip", ToolTipDirective);

app.use(router);
app.mount("#app");
