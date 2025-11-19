# Shape Up Document: OBSRVR Radar UI Foundation Upgrade

**Cycle:** Foundation Upgrade - Vue 3 + Tailwind CSS
**Appetite:** 2.5 weeks (12 working days) + 2-day cool-down
**Team:** Solo development
**Date:** 2025-11-19

---

## Problem

OBSRVR Radar is stuck on Vue 2.7 because Bootstrap-Vue blocks the upgrade to Vue 3. We need to modernize the UI stack to:
- Get off Vue 2 (EOL'd)
- Adopt Tailwind CSS for better developer experience
- Enable use of modern component libraries
- Maintain visual parity during transition

**The Blocker:** Bootstrap-Vue is not being ported to Vue 3 and must be replaced.

**The Good News:** The previous maintainer already did the hard work:
- Codebase uses Vue 2.7 with Composition API (`<script setup>`)
- 100+ components already use Vue 3 syntax
- 26 components use `vue-router/composables` (Vue 2.7 compatibility layer)

This upgrade unlocks future improvements but requires touching many files.

---

## Appetite

**12 working days** (2.5 weeks)

Breakdown:
- Week 1 (5 days): Foundation setup + Vue 3 upgrade
- Week 2 (5 days): Component building + Dashboard migration
- Buffer (2 days): Testing, bug fixes, edge cases
- Cool-down (2 days): Documentation, performance check, rest

---

## Solution (Fat-Marker Sketch)

### The Core Strategy
**Upgrade Vue 3 first → Add Tailwind → Build minimal component set → Migrate ONE page**

We're building a foundation, not migrating the entire app. Ship a working Dashboard on the new stack, accept that other pages stay on old stack temporarily.

### Phase Breakdown

**Phase 1: Baseline & Inventory** (Day 1)
- Create feature branch
- Verify current build works
- Inventory Bootstrap-Vue components
- Identify Dashboard dependencies

**Phase 2: Vue 3 Upgrade** (Days 2-4)
- Upgrade to Vue 3 + Vue Router 4
- Remove portal-vue, replace with Teleport
- Update 26 files using vue-router/composables
- Fix breaking changes (filters, $listeners, etc.)
- Get build working (may have runtime issues, that's OK)

**Phase 3: Add Tailwind** (Days 4-5)
- Install Tailwind CSS
- Configure content paths
- Extract design tokens from Tabler UI
- Verify Tailwind works (test class)
- Keep Bootstrap CSS for now (parallel stacks)

**Phase 4: Build Core Components** (Days 6-8)
- Create 5 essential components with Tailwind
  - Badge (29 uses across app)
  - Alert (22 uses across app)
  - Card (8 uses across app)
  - Button (used everywhere)
  - IconWrapper (for b-icon-* replacements)
- Use Vue 3 patterns (no $listeners)
- Match current visual design
- Simple implementations, polish later

**Phase 5: Migrate Network Dashboard** (Days 9-11)
- Replace Bootstrap-Vue in network-dashboard.vue ONLY
- Leave child components unchanged (they can keep b-* for now)
- Focus on top-level structure:
  - 3 × `<b-alert>` → `<Alert>`
  - Cards layout (Bootstrap grid is fine, keep it)
  - Badges/buttons where visible
- Test all interactions work
- Accept visual differences (minor spacing/shadows OK)

**Phase 6: Stabilize & Ship** (Days 12 + Cool-down)
- Run full test suite
- Click through all major pages
- Fix critical bugs
- Document what was done
- Document what's next
- Production build
- Deploy

---

## Scope Line

```
COULD HAVE ─────────────
- Migrate child components of Dashboard
- Dark mode support
- Custom design system
- Animation improvements
- Remove Bootstrap CSS entirely

NICE TO HAVE ───────────
- Composition API refactoring
- Performance benchmarks
- Bundle size comparison
- Modal/Table/Pagination components (complex)

MUST HAVE ══════════════
- Vue 3.4+ installed and working
- Vue Router 4 working
- portal-vue replaced with Teleport
- Tailwind CSS configured
- 5 basic UI components built
- network-dashboard.vue migrated (top-level only)
- All pages load without errors
- Production build succeeds
- No regressions on non-migrated pages
```

---

## Rabbit Holes (Don't Do This)

1. **Don't migrate all 100+ components** - Dashboard only, rest later
2. **Don't migrate Dashboard child components** - Just network-dashboard.vue top-level
3. **Don't build complex components** - No modals, tables, pagination, forms (use Bootstrap-Vue still)
4. **Don't redesign the UI** - Visual parity is the goal
5. **Don't optimize everything** - Get it working first, optimize later
6. **Don't refactor to Composition API** - It already uses Composition API, leave as-is
7. **Don't touch D3 visualizations** - Should work as-is, only fix if broken
8. **Don't remove Bootstrap CSS** - Needed for non-migrated pages
9. **Don't implement design system** - Just extract tokens, proper system later
10. **Don't fix unrelated bugs** - Scope creep trap

---

## No-Gos (Explicitly Out of Scope)

- Migrating pages other than Dashboard
- UI redesign or visual overhaul
- Chart.js upgrades
- State management refactoring
- TypeScript strict mode
- Backend API changes
- Mobile app considerations
- Accessibility audit (don't break existing a11y though)
- Performance optimization (beyond Vue 3 baseline)
- SEO improvements
- Analytics updates

---

## Done Looks Like

### Concrete Success Example

**When I run the application:**

1. `package.json` shows:
   ```json
   "vue": "^3.4.0"
   "vue-router": "^4.2.0"
   ```

2. `pnpm dev` runs without errors

3. Navigate to Network Dashboard (`https://radar.withobsrvr.com/`):
   - Page loads
   - No console errors
   - Cards render
   - Charts display
   - Alerts show (if any network issues)
   - Clicking nodes/organizations navigates correctly
   - Visual appearance ~95% same as before

4. Navigate to Nodes page:
   - Still loads (may use old Bootstrap-Vue components)
   - No errors
   - Functionality intact

5. Navigate to Organizations page:
   - Still loads
   - No errors
   - Table works

6. `pnpm build` succeeds

7. Production deployment works

### Test Checklist
```
□ Homepage loads
□ Network Dashboard displays with new components
□ Network statistics cards render
□ Charts display (Chart.js still works)
□ Alerts appear if network has issues
□ Can click into a node → Node detail page loads
□ Node detail page displays (still uses old components, that's OK)
□ Can click into an organization → Organization page loads
□ Organizations list loads
□ Search functionality works
□ Network selector switches networks
□ Time travel (if enabled) works
□ Federated voting simulator loads
□ Production build completes (no errors)
□ No Vue 2 warnings in console
□ No broken images/styles on Dashboard
```

---

## Technical Approach

### Phase 1: Baseline & Inventory (Day 1)

**1.1 Create feature branch**
```bash
cd /home/tillman/projects/obsrvr/stellarbeat
git checkout -b feat/vue3-tailwind-foundation
```

**1.2 Verify current state**
```bash
cd apps/frontend
pnpm install
pnpm build
pnpm dev
```

Navigate to:
- Dashboard (network view)
- Node detail page
- Organizations page

Confirm: All load, no console errors.

**1.3 Snapshot baseline files**

Read and save locally:
- `apps/frontend/package.json`
- `apps/frontend/vite.config.mts`
- `apps/frontend/src/app.ts`
- `apps/frontend/src/router.ts`
- `apps/frontend/src/App.vue`

**1.4 Component inventory**

Already completed:
```
Component          Count   Complexity   Priority
b-badge            29      Low          P0 (must build)
b-alert            22      Low          P0 (must build)
b-icon-*           18      Low          P0 (wrapper)
b-modal            13      High         P2 (defer)
b-form-checkbox    13      Medium       P2 (defer)
b-dropdown-*       18      Medium       P2 (defer)
b-pagination       8       High         P2 (defer)
b-card             8       Low          P0 (must build)
b-table            7       High         P2 (defer)
b-form-*           5       Medium       P2 (defer)
```

**Priority 0 (this cycle):** Badge, Alert, Card, Button, IconWrapper
**Priority 1 (next cycle):** Form inputs, Dropdowns
**Priority 2 (future):** Modal, Table, Pagination

**1.5 Identify Dashboard usage**

File: `apps/frontend/src/components/network/network-dashboard.vue`

Uses:
- `<b-alert>` (lines 4, 13, 22) - 3 instances
- `<portal-target>` (line 2) - 1 instance (needs Teleport)
- Child components use more Bootstrap-Vue (defer those)

---

### Phase 2: Vue 3 Upgrade (Days 2-4)

**2.1 Update dependencies (Day 2 morning)**

Edit `apps/frontend/package.json`:

```json
{
  "dependencies": {
    "vue": "^3.4.38",
    "vue-router": "^4.4.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.4",
    "vue-tsc": "^2.1.6"
  }
}
```

Remove these:
```json
"@vitejs/plugin-vue2": "^2.3.1",
"portal-vue": "^2.1.7"
```

Run:
```bash
pnpm install
```

**2.2 Update Vite config (Day 2 morning)**

Edit `apps/frontend/vite.config.mts`:

```typescript
// BEFORE
import vue from "@vitejs/plugin-vue2";

// AFTER
import vue from "@vitejs/plugin-vue";
```

Update rollupOptions:
```typescript
manualChunks: {
  vue: ["vue", "vue-router", "vue-multiselect"], // Remove portal-vue
  // ... rest unchanged
}
```

**2.3 Update app.ts (Day 2 morning)**

Edit `apps/frontend/src/app.ts`:

```typescript
// BEFORE
import Vue from "vue";
import { createRouter } from "./router";
import PortalVue from "portal-vue";

Vue.config.productionTip = false;

if (isProd) {
  Sentry.init({
    Vue,
    dsn: import.meta.env.VUE_APP_SENTRY_DSN,
  });
}
Vue.use(PortalVue);
Vue.component("MultiSelect", Multiselect);
Vue.directive("tooltip", ToolTipDirective);

const router = createRouter();

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");

// AFTER
import { createApp } from "vue";
import { createRouter } from "./router";

const app = createApp(App);

if (isProd) {
  Sentry.init({
    app,
    dsn: import.meta.env.VUE_APP_SENTRY_DSN,
  });
}

app.component("MultiSelect", Multiselect);
app.directive("tooltip", ToolTipDirective);

const router = createRouter();
app.use(router);

app.mount("#app");
```

**2.4 Update router.ts (Day 2 afternoon)**

Edit `apps/frontend/src/router.ts`:

```typescript
// BEFORE
import Vue from "vue";
import Router from "vue-router";
import Dashboard from "./views/Dashboard.vue";

Vue.use(Router);

export function createRouter() {
  return new Router({
    mode: "history",
    base: import.meta.env.BASE_URL,
    routes: [
      // ... routes
    ]
  });
}

// AFTER
import { createRouter as createVueRouter, createWebHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";

export function createRouter() {
  return createVueRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      // ... routes (same)
    ]
  });
}
```

**2.5 Replace portal-vue with Teleport (Day 2 afternoon)**

Search for `<portal` and `<portal-target`:

```bash
rg "<portal" apps/frontend/src --files-with-matches
```

Example fix in `network-dashboard.vue`:

```vue
<!-- BEFORE -->
<portal-target name="simulate-node-modal"></portal-target>

<!-- AFTER -->
<Teleport to="#simulate-node-modal-target">
  <!-- content -->
</Teleport>

<!-- And add target to index.html or App.vue -->
<div id="simulate-node-modal-target"></div>
```

**2.6 Update vue-router imports (Day 3)**

Find all files using `vue-router/composables`:

```bash
rg "vue-router/composables" apps/frontend/src --files-with-matches
```

Results: 26 files

For each file, replace:
```typescript
// BEFORE
import { useRoute, useRouter } from "vue-router/composables";

// AFTER
import { useRoute, useRouter } from "vue-router";
```

Can use find-replace across all files:
```bash
cd apps/frontend/src
find . -name "*.vue" -o -name "*.ts" | xargs sed -i "s|vue-router/composables|vue-router|g"
```

**2.7 Fix common Vue 3 breaking changes (Day 3-4)**

**Issue 1: $listeners removed**

Search for `$listeners`:
```bash
rg '\$listeners' apps/frontend/src
```

Replace with `$attrs` (Vue 3 merged them):
```vue
<!-- BEFORE -->
v-on="$listeners"

<!-- AFTER -->
v-bind="$attrs"
```

**Issue 2: Filters removed**

Search for filters:
```bash
rg '\|[ ]*[a-zA-Z]' apps/frontend/src --glob "*.vue"
```

Convert to methods or computed properties:
```vue
<!-- BEFORE -->
{{ value | formatDate }}

<!-- AFTER -->
{{ formatDate(value) }}

<script>
// Add as method
methods: {
  formatDate(value) { ... }
}
</script>
```

**Issue 3: Global API changes**

Search for `Vue.prototype`:
```bash
rg 'Vue\.prototype' apps/frontend/src
```

Replace with:
```typescript
// BEFORE
Vue.prototype.$myGlobal = value;

// AFTER (in app.ts)
app.config.globalProperties.$myGlobal = value;
```

**2.8 Test build (Day 4)**

```bash
pnpm build
```

Fix any TypeScript errors. Goal: Build completes (may have runtime warnings, that's OK).

Then test dev server:
```bash
pnpm dev
```

Open browser, check console. Expect some errors, that's normal. Goal: App loads, navigation works.

---

### Phase 3: Add Tailwind (Days 4-5)

**3.1 Install Tailwind (Day 4 afternoon)**

```bash
cd apps/frontend
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**3.2 Configure Tailwind (Day 4 afternoon)**

Edit `apps/frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extract from Tabler UI variables
        primary: {
          DEFAULT: '#467fcf',
          dark: '#3866a6',
        },
        secondary: {
          DEFAULT: '#868e96',
        },
        success: {
          DEFAULT: '#5eba00',
          light: '#d2f1c1',
        },
        danger: {
          DEFAULT: '#cd201f',
          light: '#fdd0d0',
        },
        warning: {
          DEFAULT: '#f1c40f',
          light: '#fcf3cf',
        },
        info: {
          DEFAULT: '#45aaf2',
          light: '#d1ecfc',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // Prefix Tailwind classes to avoid conflicts with Bootstrap
  // prefix: 'tw-', // Optional, only if conflicts arise
}
```

**3.3 Create Tailwind entry file (Day 4 afternoon)**

Create `apps/frontend/src/assets/tailwind.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom utilities to match existing design */
@layer utilities {
  .card {
    @apply rounded-lg border border-slate-200 bg-white shadow-sm;
  }

  .btn {
    @apply inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1;
  }
}
```

**3.4 Import Tailwind (Day 4 afternoon)**

Edit `apps/frontend/src/app.ts`:

```typescript
import "./assets/tailwind.css"; // Add this BEFORE custom.scss
import "./assets/custom.scss";
import "./assets/global.css";
```

**3.5 Extract design tokens (Day 5 morning)**

Read existing styles:
```bash
cat apps/frontend/src/assets/variables.scss
cat apps/frontend/src/assets/tabler-ui/_variables.scss
```

Create `apps/frontend/src/design-tokens.md` documenting:
- Colors (primary, secondary, success, danger, etc.)
- Typography (font sizes, weights)
- Spacing (margins, paddings)
- Shadows
- Border radius values

**3.6 Test Tailwind works (Day 5 morning)**

In `App.vue`, temporarily add:
```vue
<div class="bg-primary text-white p-4">
  Tailwind is working!
</div>
```

Run `pnpm dev`, verify the div has styling. Then remove test div.

---

### Phase 4: Build Core Components (Days 6-8)

Create components in: `apps/frontend/src/components/ui/`

**4.1 Badge.vue (Day 6 morning)**

```vue
<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  pill?: boolean;
}>();

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-medium';
  const rounded = props.pill ? 'rounded-full' : 'rounded';

  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-success-light text-success',
    danger: 'bg-danger-light text-danger',
    warning: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
    secondary: 'bg-slate-100 text-slate-600',
  };

  return [base, rounded, variants[props.variant || 'default']];
});
</script>
```

**4.2 Alert.vue (Day 6 afternoon)**

```vue
<template>
  <div v-if="show" :class="alertClasses" role="alert">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'success' | 'danger' | 'warning' | 'info';
  show?: boolean;
}>();

const alertClasses = computed(() => {
  const base = 'p-4 mb-4 rounded-lg border';

  const variants = {
    success: 'bg-success-light border-success text-success',
    danger: 'bg-danger-light border-danger text-danger',
    warning: 'bg-warning-light border-warning text-warning',
    info: 'bg-info-light border-info text-info',
  };

  return [base, variants[props.variant || 'info']];
});
</script>
```

**4.3 Card.vue (Day 6 afternoon)**

```vue
<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div
      v-if="title || header || $slots.header"
      class="border-b border-slate-100 px-4 py-3"
    >
      <slot name="header">
        <h3 v-if="header" class="text-base font-semibold text-slate-700">
          {{ header }}
        </h3>
        <h3 v-else-if="title" class="text-base font-semibold text-slate-700">
          {{ title }}
        </h3>
      </slot>
    </div>
    <div class="px-4 py-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  header?: string;
}>();
</script>
```

**4.4 Button.vue (Day 7 morning)**

```vue
<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}>();

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60';

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-slate-700 focus:ring-secondary',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-success',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
    warning: 'bg-warning text-white hover:bg-yellow-600 focus:ring-warning',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-primary',
  };

  return [base, sizes[props.size || 'md'], variants[props.variant || 'outline']];
});
</script>
```

**4.5 Icon.vue (Day 7 afternoon)**

Simple wrapper for Bootstrap Icons (already in dependencies):

```vue
<template>
  <i :class="`bi bi-${name}`"></i>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>
```

Usage:
```vue
<!-- BEFORE -->
<b-icon-info-circle />

<!-- AFTER -->
<Icon name="info-circle" />
```

**4.6 Register components globally (Day 8 morning)**

Edit `apps/frontend/src/app.ts`:

```typescript
import Badge from './components/ui/Badge.vue';
import Alert from './components/ui/Alert.vue';
import Card from './components/ui/Card.vue';
import Button from './components/ui/Button.vue';
import Icon from './components/ui/Icon.vue';

// After creating app
app.component('Badge', Badge);
app.component('Alert', Alert);
app.component('Card', Card);
app.component('Button', Button);
app.component('Icon', Icon);
```

**4.7 Test components in isolation (Day 8)**

Create temporary test page or add to Dashboard to verify:
- Badge renders with all variants
- Alert shows/hides correctly
- Card has proper structure
- Button has hover states
- Icon displays correctly

---

### Phase 5: Migrate Network Dashboard (Days 9-11)

**5.1 Backup original (Day 9 morning)**

```bash
cp apps/frontend/src/components/network/network-dashboard.vue \
   apps/frontend/src/components/network/network-dashboard.vue.backup
```

**5.2 Replace alerts (Day 9 morning)**

Edit `apps/frontend/src/components/network/network-dashboard.vue`:

```vue
<!-- BEFORE (line 4) -->
<b-alert :show="store.networkAnalyzer.manualMode" variant="warning">
  Network not fully analyzed...
</b-alert>

<!-- AFTER -->
<Alert :show="store.networkAnalyzer.manualMode" variant="warning">
  Network not fully analyzed...
</Alert>
```

Repeat for all 3 `<b-alert>` instances (lines 4, 13, 22).

**5.3 Replace portal-target (Day 9 afternoon)**

```vue
<!-- BEFORE (line 2) -->
<portal-target name="simulate-node-modal"></portal-target>

<!-- AFTER -->
<Teleport to="#simulate-node-modal">
  <!-- Modal content rendered here -->
</Teleport>

<!-- Add target to App.vue or index.html -->
<div id="simulate-node-modal"></div>
```

**5.4 Update component imports (Day 9 afternoon)**

```vue
<script setup lang="ts">
// Add
import Alert from '@/components/ui/Alert.vue';

// If Badge or Button used, add those too
</script>
```

**5.5 Test Dashboard (Day 10)**

```bash
pnpm dev
```

Navigate to Dashboard, verify:
- [ ] Alerts render correctly
- [ ] Alert styling matches (colors, spacing)
- [ ] Alert show/hide logic works
- [ ] No console errors
- [ ] Child components still work (they use old Bootstrap-Vue, that's OK)

**5.6 Visual polish (Day 10-11)**

Compare old vs new Dashboard side-by-side. Adjust:
- Alert padding/margins
- Font sizes
- Border colors
- Icon sizes

Goal: 95% visual parity. Small differences acceptable.

**5.7 Test other pages still work (Day 11)**

Navigate to:
- Node detail page (should still work with old components)
- Organizations page (should still work)
- Search (should still work)
- Network switcher (should still work)

Fix any broken navigation or interactions.

---

### Phase 6: Stabilize & Ship (Day 12 + Cool-down)

**6.1 Full application test (Day 12 morning)**

Run through test checklist:
```
□ Homepage loads
□ Network Dashboard displays
□ Alerts render with correct styling
□ Charts display (Chart.js)
□ Can click into node
□ Node detail page loads
□ Can click into organization
□ Organization page loads
□ Search works
□ Network selector works
□ Time travel works
□ Federated voting simulator loads
□ No critical console errors
```

**6.2 Production build (Day 12 afternoon)**

```bash
pnpm build
```

Check:
- Build succeeds
- No errors or critical warnings
- Bundle size (document for comparison)

**6.3 Document changes (Cool-down Day 1)**

Create `apps/frontend/UPGRADE_NOTES.md`:

```markdown
# Vue 3 + Tailwind Upgrade Notes

## What Changed

### Dependencies
- Vue 2.7 → Vue 3.4
- Vue Router 3 → Vue Router 4
- Added Tailwind CSS 3.x
- Removed portal-vue (replaced with Teleport)
- Updated @vitejs/plugin-vue2 → @vitejs/plugin-vue

### New UI Components
Location: `src/components/ui/`

- Badge.vue - Replaces b-badge
- Alert.vue - Replaces b-alert
- Card.vue - Replaces b-card (header/body)
- Button.vue - Replaces b-button
- Icon.vue - Replaces b-icon-*

### Migrated Pages
- ✅ Network Dashboard (`src/components/network/network-dashboard.vue`)
  - Uses new Alert component
  - Uses Teleport instead of portal-vue

### Still Using Bootstrap-Vue
- Node detail page
- Organization page
- All child components of Dashboard
- Modal dialogs
- Tables
- Form inputs
- Pagination

These will be migrated in future cycles.

## Breaking Changes

### Router Imports
All files using `vue-router/composables` updated to `vue-router`.

### portal-vue Removed
Replaced with Vue 3's built-in Teleport component.

### $listeners
Merged into $attrs in Vue 3. Updated where used.

## Next Steps

### Priority 1 (Next Cycle)
- Migrate Node detail page
- Migrate Organizations page
- Build Form input components
- Build Dropdown components

### Priority 2 (Future)
- Build Modal component
- Build Table component
- Build Pagination component
- Remove Bootstrap CSS
- Performance optimization

## Development

### Running Locally
```bash
pnpm dev
```

### Building
```bash
pnpm build
```

### Common Issues

**Issue:** Tailwind classes not working
**Fix:** Ensure tailwind.css is imported in app.ts

**Issue:** Components not found
**Fix:** Check they're registered globally in app.ts

**Issue:** Bootstrap conflicts
**Fix:** Keep Bootstrap CSS for now, it's needed for non-migrated components
```

**6.4 Create migration guide (Cool-down Day 1)**

Create `apps/frontend/MIGRATION_GUIDE.md`:

```markdown
# Migration Guide: Bootstrap-Vue → Tailwind Components

## How to Migrate a Component

### 1. Identify Bootstrap-Vue usage
```bash
rg "<b-" src/components/your-component.vue
```

### 2. Check if replacement exists
- Badge → `<Badge>`
- Alert → `<Alert>`
- Card → `<Card>`
- Button → `<Button>`
- Icon → `<Icon name="...">`

### 3. Update template
```vue
<!-- BEFORE -->
<b-badge variant="success">Active</b-badge>

<!-- AFTER -->
<Badge variant="success">Active</Badge>
```

### 4. Update imports (if not global)
```vue
<script setup>
import Badge from '@/components/ui/Badge.vue';
</script>
```

### 5. Test
- Visual appearance
- Interactions
- Props work correctly

## Component API Reference

### Badge
```vue
<Badge variant="success|danger|warning|info|default" pill>
  Content
</Badge>
```

### Alert
```vue
<Alert variant="success|danger|warning|info" :show="boolean">
  Message
</Alert>
```

### Card
```vue
<Card title="Title">
  <template #header>Custom header</template>
  Content
</Card>
```

### Button
```vue
<Button
  variant="primary|secondary|success|danger|outline"
  size="sm|md|lg"
  :disabled="boolean"
  @click="handler"
>
  Label
</Button>
```

### Icon
```vue
<Icon name="info-circle" />
<!-- Uses Bootstrap Icons: https://icons.getbootstrap.com/ -->
```

## Design Tokens

Colors available in Tailwind config:
- `bg-primary` / `text-primary`
- `bg-success` / `text-success`
- `bg-danger` / `text-danger`
- `bg-warning` / `text-warning`
- `bg-info` / `text-info`

See `tailwind.config.js` for full list.
```

**6.5 Performance check (Cool-down Day 2)**

Compare before/after:

```bash
# Build
pnpm build

# Check bundle sizes
ls -lh dist/assets/*.js
```

Document:
- Total bundle size
- Largest chunks
- Any significant changes

**6.6 Git commit (Cool-down Day 2)**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: Upgrade to Vue 3 and add Tailwind CSS foundation

- Upgrade Vue 2.7 → Vue 3.4
- Upgrade Vue Router 3 → Vue Router 4
- Add Tailwind CSS with design tokens
- Remove portal-vue, replace with Teleport
- Update 26 files using vue-router/composables
- Create 5 core UI components (Badge, Alert, Card, Button, Icon)
- Migrate Network Dashboard to new components
- All pages still functional

This establishes the foundation for future UI improvements.
Other pages will be migrated in subsequent cycles.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**6.7 Deploy to staging (Cool-down Day 2)**

```bash
# Push branch
git push origin feat/vue3-tailwind-foundation

# Deploy to staging environment for testing
# (Follow your deployment process)
```

---

## Progress Tracking (Hill Chart)

```
Figuring Out              Making It Happen
    ↓                            ↓
|-------|-------|-------|-------|
0      25      50      75     100

Day 1:  [•]..........................  Baseline
Day 2:  ...[•]........................  Vue 3 upgrade started
Day 3:  .....[•]......................  Fixing breaking changes
Day 4:  ........[•]...................  Build working, Tailwind started
Day 5:  ..........[•].................  Tailwind configured (TOP OF HILL)
Day 6:  ............[•]...............  Building components
Day 7:  ..............[•].............  Components finished
Day 8:  ................[•]...........  Testing components
Day 9:  ..................[•].........  Migrating Dashboard
Day 10: ....................[•]........  Dashboard complete
Day 11: ......................[•]......  Testing full app
Day 12: ........................[•]....  Stabilizing
Cool:   ..........................[•]..  Shipped!
```

**🚨 Check at Day 6:** If still on left side of hill (figuring out components) → Cut scope to 3 components (Badge, Alert, Card only)

**🚨 Check at Day 10:** If Dashboard not migrated → Accept partial migration, ship what's done

---

## Risks & Mitigations

### Risk 1: Vue 3 Upgrade Has Unexpected Breaking Changes
**Probability:** Medium
**Impact:** High

**Mitigation:**
- Allocate full 3 days for upgrade (Days 2-4)
- Test incrementally (build, then dev server, then pages)
- Accept some pages may break temporarily
- Document known issues

**Fallback:**
- If blocked beyond Day 5 → Revert Vue 3 upgrade, ship Tailwind only on Vue 2.7
- Continue Vue 3 upgrade in next cycle with more time

### Risk 2: Too Many Portal-Vue Usages
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Inventory portal-vue usage early (Day 2)
- If more than 10 instances → Create helper wrapper component
- If complex logic → Accept some modals stay broken, fix in cool-down

### Risk 3: Dashboard Child Components Break
**Probability:** Medium
**Impact:** Low

**Mitigation:**
- Don't migrate child components (out of scope)
- They can keep using Bootstrap-Vue
- If they break due to Vue 3 changes → Fix just those breaking changes, don't migrate to Tailwind

### Risk 4: Visual Differences Too Large
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Extract design tokens early (Day 5)
- Compare side-by-side frequently
- Accept small differences (spacing, shadows)
- If major differences → Adjust component classes, use more specific Tailwind utilities

### Risk 5: Build Size Increases Significantly
**Probability:** Medium
**Impact:** Low

**Mitigation:**
- Tailwind + Bootstrap temporarily increases size (expected)
- Configure Tailwind purge correctly
- Check bundle size at end (Day 12)
- If too large → Document for future optimization, accept for now

### Risk 6: Third-Party Library Incompatibilities
**Probability:** Low
**Impact:** High

**Mitigation:**
- Chart.js, D3, Leaflet should work with Vue 3
- Test each library early (Day 4-5)
- If broken → Check for Vue 3 compatible version
- If no compatible version → That library stays on old component, migrate page later

---

## Deployment Strategy

### Staging Deployment (Cool-down Day 2)
1. Push feature branch
2. Deploy to staging environment
3. Run smoke tests
4. Share with stakeholders for feedback

### Production Deployment (After Cool-down)
**Option A: Feature Flag**
- Deploy to production with feature flag
- Enable for 10% of users
- Monitor errors
- Gradually increase to 100%

**Option B: Direct Deploy**
- Merge to main
- Deploy to production
- Monitor closely for 24 hours
- Rollback plan ready

**Rollback Plan:**
- Keep previous build artifact
- Can revert via git revert
- Redeploy previous version in <5 minutes

---

## Follow-up Cycles

### Cool-Down (2 days)
- Fix critical bugs found in testing
- Polish visual differences
- Update documentation
- Rest

### Cycle 2: Migrate Core Pages (1.5 weeks)
- Migrate Node detail page
- Migrate Organizations page
- Build Form input components
- Build Dropdown components

### Cycle 3: Complex Components (2 weeks)
- Build Modal component (complex, needs focus trap, animations)
- Build Table component (sorting, filtering)
- Build Pagination component
- Migrate pages using these components

### Cycle 4: Remove Bootstrap (1 week)
- Ensure all pages migrated
- Remove Bootstrap CSS
- Remove Bootstrap JS
- Clean up unused dependencies
- Bundle size optimization

### Cycle 5: Design System Polish (1 week)
- Refine design tokens
- Add dark mode support
- Improve animations/transitions
- Accessibility audit
- Performance optimization

---

## Success Metrics

### Technical Metrics
- ✅ Build succeeds with no errors
- ✅ All pages load without console errors
- ✅ Vue DevTools shows Vue 3
- ✅ No regression in functionality
- ⚠️ Bundle size increase <20% (temporary, due to dual CSS frameworks)

### User Metrics
- ✅ Visual parity ~95% on Dashboard
- ✅ No increase in bug reports
- ✅ Page load time unchanged or better
- ✅ All user flows still work

### Developer Metrics
- ✅ New components easy to use
- ✅ Migration guide clear and helpful
- ✅ Build time unchanged or faster
- ✅ Hot reload still fast

---

## Questions Before Starting

### Technical Clarifications
1. **Testing:** Are there existing tests that need updating?
2. **CI/CD:** Will CI pipeline need updates for Vue 3?
3. **Browser Support:** What's the minimum browser version to support?
4. **Performance Budget:** Is there a max bundle size limit?

### Process Clarifications
1. **Approval:** Who needs to approve the changes before production deploy?
2. **Staging Environment:** Is staging environment available for testing?
3. **Rollback Authority:** Who can authorize a rollback if issues arise?
4. **User Communication:** Should users be notified of the upgrade?

### Design Clarifications
1. **Visual Changes:** Are small visual differences (spacing, shadows) acceptable?
2. **Design System:** Is there existing brand guidelines documentation?
3. **Accessibility:** What WCAG level should we target (A, AA, AAA)?
4. **Dark Mode:** Is dark mode support required now or future?

---

## Appendix: File Changes Summary

### Modified Files (~30)
- `package.json` - Dependencies updated
- `vite.config.mts` - Plugin changed
- `app.ts` - Vue 3 initialization
- `router.ts` - Vue Router 4 API
- `tailwind.config.js` - New file
- `src/assets/tailwind.css` - New file
- 26 files - Router import updates
- `network-dashboard.vue` - Component migration
- Various files - portal-vue → Teleport

### New Files (~7)
- `src/components/ui/Badge.vue`
- `src/components/ui/Alert.vue`
- `src/components/ui/Card.vue`
- `src/components/ui/Button.vue`
- `src/components/ui/Icon.vue`
- `UPGRADE_NOTES.md`
- `MIGRATION_GUIDE.md`
- `design-tokens.md`

### Deleted Files (~1)
- None (keeping bootstrap-vue in package.json for non-migrated pages)

### Total Files Touched: ~40
### Total Lines Changed: ~500-800

---

## Final Notes

This upgrade establishes the foundation for modernizing OBSRVR Radar's UI stack. The approach is conservative, minimizing risk by:
- Upgrading core framework first
- Migrating one page as proof-of-concept
- Keeping fallback options (Bootstrap-Vue still available)
- Documenting everything for future developers

The result is a working application on Vue 3 + Tailwind, with one fully migrated page, ready for incremental improvements in future cycles.

**Ship on time. Accept imperfection. Iterate.**
