import App from "./App.vue";
import { createApp } from "vue";
import { createRouter } from "./router";
import "./assets/tailwind.css";
import "./assets/custom.scss";
import "./assets/global.css";
import Multiselect from "vue-multiselect";
import * as Sentry from "@sentry/vue";
import "popper.js";
import "bootstrap/js/dist/dropdown";
import "bootstrap/js/dist/collapse";
import "bootstrap/js/dist/tooltip";
import "bootstrap/js/dist/modal";
import ToolTipDirective from "./directives/tooltip";
import { BIconBullseye, BIconBuilding, BIconInfoCircle } from "bootstrap-vue";
// Import new Tailwind-based UI components
import Badge from './components/ui/Badge.vue';
import Alert from './components/ui/Alert.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Icon from './components/ui/Icon.vue';

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
app.component("BIconBullseye", BIconBullseye);
app.component("BIconBuilding", BIconBuilding);
app.component("BIconInfoCircle", BIconInfoCircle);
// Register new Tailwind-based UI components globally
app.component("Badge", Badge);
app.component("Alert", Alert);
app.component("Card", Card);
app.component("Button", Button);
app.component("Icon", Icon);
app.directive("tooltip", ToolTipDirective);

app.use(router);
app.mount("#app");
