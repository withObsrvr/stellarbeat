/**
 * Bootstrap-Vue Compatibility Layer
 *
 * Minimal Vue 3 compatible replacements for Bootstrap-Vue components.
 * These use Bootstrap 4 CSS classes (already loaded) for styling.
 * Goal: Get the app running, then incrementally replace with Tailwind components.
 */

/* eslint-disable vue/one-component-per-file */
/* eslint-disable vue/require-default-prop */
/* eslint-disable vue/require-prop-types */

import { h, defineComponent, PropType, ref, onMounted, watch, Teleport, resolveComponent } from 'vue';

// Type exports for table field arrays
export type BvTableField = {
  key: string;
  label?: string;
  sortable?: boolean;
  class?: string;
};
// Allow mixed arrays of strings and BvTableField objects
export type BvTableFieldArray = (BvTableField | string)[];

// Simple icon components using Bootstrap Icons
export const BIconBullseye = defineComponent({
  render: () => h('i', { class: 'bi bi-bullseye' })
});

export const BIconBuilding = defineComponent({
  render: () => h('i', { class: 'bi bi-building' })
});

export const BIconInfoCircle = defineComponent({
  render: () => h('i', { class: 'bi bi-info-circle' })
});

export const BIconExclamationTriangle = defineComponent({
  render: () => h('i', { class: 'bi bi-exclamation-triangle' })
});

export const BIconShield = defineComponent({
  render: () => h('i', { class: 'bi bi-shield' })
});

export const BIconX = defineComponent({
  render: () => h('i', { class: 'bi bi-x' })
});

export const BIconHouse = defineComponent({
  render: () => h('i', { class: 'bi bi-house' })
});

export const BIconEnvelope = defineComponent({
  render: () => h('i', { class: 'bi bi-envelope' })
});

export const BIconLightning = defineComponent({
  render: () => h('i', { class: 'bi bi-lightning' })
});

export const BIconLightningFill = defineComponent({
  render: () => h('i', { class: 'bi bi-lightning-fill' })
});

export const BIconPlusCircle = defineComponent({
  render: () => h('i', { class: 'bi bi-plus-circle' })
});

export const BIconThreeDotsVertical = defineComponent({
  render: () => h('i', { class: 'bi bi-three-dots-vertical' })
});

export const BIconXCircle = defineComponent({
  render: () => h('i', { class: 'bi bi-x-circle' })
});

export const BIconChevronDoubleLeft = defineComponent({
  render: () => h('i', { class: 'bi bi-chevron-double-left' })
});

export const BIconFullscreen = defineComponent({
  render: () => h('i', { class: 'bi bi-fullscreen' })
});

export const BIconFullscreenExit = defineComponent({
  render: () => h('i', { class: 'bi bi-fullscreen-exit' })
});

export const BIconList = defineComponent({
  props: {
    fontScale: {
      type: [String, Number],
      default: 1
    }
  },
  setup(props) {
    return () => h('i', {
      class: 'bi bi-list',
      style: {
        fontSize: `${Number(props.fontScale) * 15}px`
      }
    });
  }
});

export const BIconZoomIn = defineComponent({
  render: () => h('i', { class: 'bi bi-zoom-in' })
});

export const BIconLink = defineComponent({
  render: () => h('i', { class: 'bi bi-link' })
});

export const BIconMap = defineComponent({
  render: () => h('i', { class: 'bi bi-map' })
});

export const BIconPhone = defineComponent({
  render: () => h('i', { class: 'bi bi-phone' })
});

export const BIconClock = defineComponent({
  render: () => h('i', { class: 'bi bi-clock' })
});

export const BIconFileDiff = defineComponent({
  render: () => h('i', { class: 'bi bi-file-diff' })
});

export const BIconPlus = defineComponent({
  render: () => h('i', { class: 'bi bi-plus' })
});

export const BIconDownload = defineComponent({
  render: () => h('i', { class: 'bi bi-download' })
});

export const BIconChevronRight = defineComponent({
  render: () => h('i', { class: 'bi bi-chevron-right' })
});

export const BIconChevronDown = defineComponent({
  render: () => h('i', { class: 'bi bi-chevron-down' })
});

export const BIconChevronUp = defineComponent({
  render: () => h('i', { class: 'bi bi-chevron-up' })
});

export const BIconChevronLeft = defineComponent({
  render: () => h('i', { class: 'bi bi-chevron-left' })
});

export const BIconGearWide = defineComponent({
  render: () => h('i', { class: 'bi bi-gear-wide' })
});

export const BIconGear = defineComponent({
  render: () => h('i', { class: 'bi bi-gear' })
});

export const BIconSearch = defineComponent({
  render: () => h('i', { class: 'bi bi-search' })
});

export const BIconPencil = defineComponent({
  render: () => h('i', { class: 'bi bi-pencil' })
});

export const BIconBroadcast = defineComponent({
  render: () => h('i', { class: 'bi bi-broadcast' })
});

export const BIconCalendar = defineComponent({
  render: () => h('i', { class: 'bi bi-calendar' })
});

export const BIconBell = defineComponent({
  render: () => h('i', { class: 'bi bi-bell' })
});

export const BIconCode = defineComponent({
  render: () => h('i', { class: 'bi bi-code' })
});

export const BIconNewspaper = defineComponent({
  render: () => h('i', { class: 'bi bi-newspaper' })
});

export const BIconQuestionCircle = defineComponent({
  render: () => h('i', { class: 'bi bi-question-circle' })
});

export const BIconClipboard = defineComponent({
  render: () => h('i', { class: 'bi bi-clipboard' })
});

export const BIconGlobe = defineComponent({
  render: () => h('i', { class: 'bi bi-globe' })
});

export const BIconStar = defineComponent({
  render: () => h('i', { class: 'bi bi-star' })
});

export const BIconStarFill = defineComponent({
  render: () => h('i', { class: 'bi bi-star-fill' })
});

export const BIconInfoCircleFill = defineComponent({
  render: () => h('i', { class: 'bi bi-info-circle-fill' })
});

export const BIconCheckCircleFill = defineComponent({
  render: () => h('i', { class: 'bi bi-check-circle-fill' })
});

export const BIconExclamationCircleFill = defineComponent({
  render: () => h('i', { class: 'bi bi-exclamation-circle-fill' })
});

export const BIconArrowClockwise = defineComponent({
  render: () => h('i', { class: 'bi bi-arrow-clockwise' })
});

export const BIconArrowCounterclockwise = defineComponent({
  render: () => h('i', { class: 'bi bi-arrow-counterclockwise' })
});

export const BIconPerson = defineComponent({
  render: () => h('i', { class: 'bi bi-person' })
});

export const BIconEnvelopeFill = defineComponent({
  render: () => h('i', { class: 'bi bi-envelope-fill' })
});

export const BIconExclamation = defineComponent({
  render: () => h('i', { class: 'bi bi-exclamation' })
});

export const BIconQuestionCircleFill = defineComponent({
  render: () => h('i', { class: 'bi bi-question-circle-fill' })
});

export const BIconUpload = defineComponent({
  render: () => h('i', { class: 'bi bi-upload' })
});

export const BIconPauseFill = defineComponent({
  render: () => h('i', { class: 'bi bi-pause-fill' })
});

export const BIconPlayFill = defineComponent({
  render: () => h('i', { class: 'bi bi-play-fill' })
});

export const BIconSkipBackwardFill = defineComponent({
  render: () => h('i', { class: 'bi bi-skip-backward-fill' })
});

export const BIconSkipForwardFill = defineComponent({
  render: () => h('i', { class: 'bi bi-skip-forward-fill' })
});

export const BIconStopFill = defineComponent({
  render: () => h('i', { class: 'bi bi-stop-fill' })
});

// BModal - Simple modal using Bootstrap 4 modal classes
export const BModal = defineComponent({
  name: 'BModal',
  props: {
    id: String,
    title: String,
    size: String,
    hideFooter: Boolean,
    hideHeader: Boolean,
    noCloseOnBackdrop: Boolean,
    visible: Boolean,
    modelValue: Boolean,  // Vue 3 v-model support
    lazy: Boolean,
    okOnly: Boolean,
    okTitle: {
      type: String,
      default: 'OK'
    },
    cancelTitle: {
      type: String,
      default: 'Cancel'
    }
  },
  emits: ['update:visible', 'update:modelValue', 'ok', 'cancel', 'hidden', 'shown', 'show'],
  setup(props, { slots, emit }) {
    const isVisible = ref(props.modelValue || props.visible || false);
    const rootEl = ref<HTMLElement | null>(null);

    const showModal = () => {
      console.log('[BModal] show-modal event received for', props.id);
      console.log('[BModal] Setting isVisible to true');
      isVisible.value = true;
      emit('update:visible', true);
      emit('update:modelValue', true);
      emit('show');
      emit('shown');
      console.log('[BModal] isVisible is now:', isVisible.value);
    };

    // Listen for show-modal event - set up as early as possible
    onMounted(() => {
      console.log('[BModal] onMounted for', props.id);

      // Always set up global event listener for lazy modals
      if (props.id) {
        console.log('[BModal] Setting up global document listener for', props.id);
        const handleGlobalEvent = (e: Event) => {
          const customEvent = e as CustomEvent;
          console.log('[BModal] Received global event, detail:', customEvent.detail, 'matching:', props.id);
          if (customEvent.detail?.modalId === props.id) {
            console.log('[BModal] Global event matched modal ID', props.id);
            showModal();
          }
        };
        document.addEventListener('show-modal-global', handleGlobalEvent);

        // Also set up direct element listener if rootEl is available
        if (rootEl.value) {
          console.log('[BModal] Setting up direct element listener for', props.id);
          rootEl.value.addEventListener('show-modal', showModal);
        }
      }
    });

    // Watch for prop changes (support both visible and modelValue)
    watch(() => props.modelValue ?? props.visible, (newVal) => {
      if (newVal !== undefined) {
        isVisible.value = newVal;
      }
    });

    const close = () => {
      isVisible.value = false;
      emit('update:visible', false);
      emit('update:modelValue', false);
      emit('hidden');
    };

    const handleOk = () => {
      emit('ok');
      close();
    };

    const handleCancel = () => {
      emit('cancel');
      close();
    };

    return () => h('div', {
      ref: rootEl,
      id: props.id
    }, [
      isVisible.value ? h(Teleport, { to: 'body' }, [
        // Backdrop
        h('div', {
          class: 'modal-backdrop fade show',
          style: 'z-index: 10100; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5);'
        }),
        // Modal
        h('div', {
          class: 'modal fade show',
          style: 'display: block; z-index: 10200; position: fixed; top: 0; left: 0; width: 100%; height: 100%; overflow-x: hidden; overflow-y: auto;',
          onClick: (e: Event) => {
            if (!props.noCloseOnBackdrop && e.target === e.currentTarget) {
              close();
            }
          }
        }, [
          h('div', {
            class: ['modal-dialog', props.size ? `modal-${props.size}` : ''],
            style: 'position: relative; z-index: 10201;'
          }, [
            h('div', {
              class: 'modal-content',
              style: 'position: relative; z-index: 10202;'
            }, [
              !props.hideHeader && h('div', { class: 'modal-header' },
                slots['modal-header']?.({ close }) || [
                  h('h5', { class: 'modal-title' }, props.title || slots.title?.()),
                  h('button', {
                    type: 'button',
                    class: 'close',
                    'aria-label': 'Close',
                    onClick: close
                  }, h('span', { 'aria-hidden': 'true' }, '×'))
                ]
              ),
              h('div', { class: 'modal-body' }, slots.default?.()),
              !props.hideFooter && h('div', { class: 'modal-footer' },
                slots['modal-footer']?.({ ok: handleOk, cancel: handleCancel }) ||
                slots.footer?.() || [
                  !props.okOnly && h('button', {
                    type: 'button',
                    class: 'btn btn-secondary',
                    onClick: handleCancel
                  }, props.cancelTitle),
                  h('button', {
                    type: 'button',
                    class: 'btn btn-primary',
                    onClick: handleOk
                  }, props.okTitle)
                ]
              )
            ])
          ])
        ])
      ]) : null
    ]);
  }
});

// BTable - Table with pagination, sorting, and filtering
export const BTable = defineComponent({
  name: 'BTable',
  props: {
    items: Array as PropType<any[]>,
    fields: Array as PropType<any[]>,
    hover: Boolean,
    striped: Boolean,
    bordered: Boolean,
    small: Boolean,
    perPage: Number,
    currentPage: Number,
    filter: String,
    sortBy: String,
    sortDesc: Boolean,
    responsive: [Boolean, String],
  },
  setup(props, { slots }) {
    return () => {
      let displayItems = props.items || [];

      // Apply filtering
      if (props.filter) {
        const filterLower = props.filter.toLowerCase();
        displayItems = displayItems.filter(item =>
          Object.values(item).some(val =>
            String(val).toLowerCase().includes(filterLower)
          )
        );
      }

      // Apply sorting
      if (props.sortBy && displayItems.length > 0) {
        displayItems = [...displayItems].sort((a, b) => {
          const aVal = a[props.sortBy!];
          const bVal = b[props.sortBy!];

          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;

          return props.sortDesc ? -comparison : comparison;
        });
      }

      // Apply pagination
      if (props.perPage && props.currentPage) {
        const start = (props.currentPage - 1) * props.perPage;
        const end = start + props.perPage;
        displayItems = displayItems.slice(start, end);
      }

      const table = h('table', {
        class: [
          'table',
          props.hover && 'table-hover',
          props.striped && 'table-striped',
          props.bordered && 'table-bordered',
          props.small && 'table-sm'
        ].filter(Boolean)
      }, [
        h('thead', {}, [
          h('tr', {}, props.fields?.map(field => {
            const fieldObj = typeof field === 'string' ? { key: field, label: field } : field;
            return h('th', {}, slots[`head(${fieldObj.key})`]?.({ label: fieldObj.label, field: fieldObj }) || fieldObj.label || fieldObj.key);
          }))
        ]),
        h('tbody', {}, displayItems.map((item, idx) =>
          h('tr', { key: idx }, props.fields?.map(field => {
            const key = typeof field === 'string' ? field : field.key;
            const cellClass = typeof field !== 'string' && field.tdClass ? field.tdClass : '';
            return h('td', { class: cellClass }, slots[`cell(${key})`]?.({ item, value: item[key] }) || item[key]);
          }))
        ))
      ]);

      // Wrap in responsive div if needed
      if (props.responsive) {
        return h('div', { class: 'table-responsive' }, table);
      }

      return table;
    };
  }
});

// BFormGroup
export const BFormGroup = defineComponent({
  name: 'BFormGroup',
  props: {
    label: String,
    labelFor: String,
  },
  setup(props, { slots }) {
    return () => h('div', { class: 'form-group' }, [
      props.label && h('label', { for: props.labelFor }, props.label),
      slots.default?.()
    ]);
  }
});

// BFormInput
export const BFormInput = defineComponent({
  name: 'BFormInput',
  props: {
    modelValue: [String, Number],
    type: { type: String, default: 'text' },
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('input', {
      ...attrs,
      class: 'form-control',
      type: props.type,
      value: props.modelValue,
      placeholder: props.placeholder,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    });
  }
});

// BFormCheckbox
export const BFormCheckbox = defineComponent({
  name: 'BFormCheckbox',
  props: {
    modelValue: [Boolean, Array],
    value: {},
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    return () => h('div', { class: 'form-check' }, [
      h('input', {
        class: 'form-check-input',
        type: 'checkbox',
        checked: Array.isArray(props.modelValue)
          ? props.modelValue.includes(props.value)
          : props.modelValue,
        onChange: (e: Event) => {
          const checked = (e.target as HTMLInputElement).checked;
          if (Array.isArray(props.modelValue)) {
            const newValue = checked
              ? [...props.modelValue, props.value]
              : props.modelValue.filter(v => v !== props.value);
            emit('update:modelValue', newValue);
          } else {
            emit('update:modelValue', checked);
          }
        }
      }),
      h('label', { class: 'form-check-label' }, slots.default?.())
    ]);
  }
});

// BDropdown
export const BDropdown = defineComponent({
  name: 'BDropdown',
  props: {
    text: String,
    variant: String,
    size: String,
  },
  setup(props, { slots }) {
    return () => h('div', { class: 'dropdown' }, [
      h('button', {
        class: [
          'btn dropdown-toggle',
          props.variant ? `btn-${props.variant}` : 'btn-secondary',
          props.size && `btn-${props.size}`
        ].filter(Boolean).join(' '),
        type: 'button',
        'data-toggle': 'dropdown',
        onClick: (e: Event) => {
          e.stopPropagation();
        }
      }, props.text),
      h('div', { class: 'dropdown-menu' }, slots.default?.())
    ]);
  }
});

export const BDropdownItem = defineComponent({
  name: 'BDropdownItem',
  setup(props, { slots, attrs }) {
    return () => h('a', {
      ...attrs,
      class: 'dropdown-item',
      href: '#'
    }, slots.default?.());
  }
});

export const BDropdownHeader = defineComponent({
  name: 'BDropdownHeader',
  setup(props, { slots }) {
    return () => h('h6', { class: 'dropdown-header' }, slots.default?.());
  }
});

// BPagination
export const BPagination = defineComponent({
  name: 'BPagination',
  props: {
    modelValue: Number,
    totalRows: Number,
    perPage: { type: Number, default: 20 },
    limit: { type: Number, default: 4 }, // Maximum number of page buttons to show
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const totalPages = () => Math.ceil((props.totalRows || 0) / props.perPage);
    const currentPage = () => props.modelValue || 1;

    const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages()) {
        emit('update:modelValue', page);
      }
    };

    return () => {
      const total = totalPages();
      const current = currentPage();
      const maxButtons = props.limit;

      // Calculate which page numbers to show
      let startPage = 1;
      let endPage = Math.min(maxButtons, total);

      // If current page is beyond the initial range, adjust the window
      if (current > maxButtons) {
        startPage = current - Math.floor(maxButtons / 2);
        endPage = current + Math.floor(maxButtons / 2);

        // Adjust if we're near the end
        if (endPage > total) {
          endPage = total;
          startPage = Math.max(1, total - maxButtons + 1);
        }
      }

      const pageNumbers = Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i
      );

      const items: any[] = [];

      // Previous button
      items.push(
        h('li', {
          class: ['page-item', current === 1 && 'disabled'].filter(Boolean)
        }, [
          h('a', {
            class: 'page-link',
            href: '#',
            onClick: (e: Event) => {
              e.preventDefault();
              goToPage(current - 1);
            }
          }, '‹')
        ])
      );

      // Page number buttons
      pageNumbers.forEach(page => {
        items.push(
          h('li', {
            class: ['page-item', page === current && 'active'].filter(Boolean)
          }, [
            h('a', {
              class: 'page-link',
              href: '#',
              onClick: (e: Event) => {
                e.preventDefault();
                goToPage(page);
              }
            }, page.toString())
          ])
        );
      });

      // Next button
      items.push(
        h('li', {
          class: ['page-item', current === total && 'disabled'].filter(Boolean)
        }, [
          h('a', {
            class: 'page-link',
            href: '#',
            onClick: (e: Event) => {
              e.preventDefault();
              goToPage(current + 1);
            }
          }, '›')
        ])
      );

      return h('ul', { class: 'pagination' }, items);
    };
  }
});

// BListGroup
export const BListGroup = defineComponent({
  name: 'BListGroup',
  setup(props, { slots }) {
    return () => h('ul', { class: 'list-group' }, slots.default?.());
  }
});

export const BListGroupItem = defineComponent({
  name: 'BListGroupItem',
  props: {
    active: Boolean,
    disabled: Boolean,
  },
  setup(props, { slots, attrs }) {
    return () => h('li', {
      ...attrs,
      class: [
        'list-group-item',
        props.active && 'active',
        props.disabled && 'disabled'
      ].filter(Boolean)
    }, slots.default?.());
  }
});

// BCard components
export const BCard = defineComponent({
  name: 'BCard',
  props: {
    title: String,
    subTitle: String,
  },
  setup(props, { slots }) {
    return () => h('div', { class: 'card' }, [
      (props.title || slots.header) && h('div', { class: 'card-header' },
        slots.header?.() || props.title
      ),
      h('div', { class: 'card-body' }, [
        props.subTitle && h('h6', { class: 'card-subtitle mb-2 text-muted' }, props.subTitle),
        slots.default?.()
      ]),
      slots.footer && h('div', { class: 'card-footer' }, slots.footer())
    ]);
  }
});

export const BCardHeader = defineComponent({
  name: 'BCardHeader',
  setup(props, { slots }) {
    return () => h('div', { class: 'card-header' }, slots.default?.());
  }
});

export const BCardBody = defineComponent({
  name: 'BCardBody',
  setup(props, { slots }) {
    return () => h('div', { class: 'card-body' }, slots.default?.());
  }
});

// BIcon - generic icon component
export const BIcon = defineComponent({
  name: 'BIcon',
  props: {
    icon: String,
  },
  setup(props) {
    return () => h('i', { class: `bi bi-${props.icon}` });
  }
});

// BCollapse
export const BCollapse = defineComponent({
  name: 'BCollapse',
  props: {
    visible: Boolean,
    id: String,
  },
  setup(props, { slots }) {
    return () => props.visible
      ? h('div', { id: props.id, class: 'collapse show' }, slots.default?.())
      : h('div', { id: props.id, class: 'collapse' }, slots.default?.());
  }
});

// BBadge
export const BBadge = defineComponent({
  name: 'BBadge',
  props: {
    variant: String,
    pill: Boolean,
  },
  setup(props, { slots }) {
    return () => h('span', {
      class: [
        'badge',
        props.variant ? `badge-${props.variant}` : 'badge-secondary',
        props.pill && 'badge-pill'
      ].filter(Boolean)
    }, slots.default?.());
  }
});

// BAlert
export const BAlert = defineComponent({
  name: 'BAlert',
  props: {
    show: Boolean,
    variant: String,
    dismissible: Boolean,
  },
  emits: ['dismissed'],
  setup(props, { slots, emit }) {
    return () => props.show ? h('div', {
      class: ['alert', props.variant ? `alert-${props.variant}` : 'alert-info', props.dismissible && 'alert-dismissible'].filter(Boolean),
      role: 'alert'
    }, [
      slots.default?.(),
      props.dismissible && h('button', {
        type: 'button',
        class: 'close',
        onClick: () => emit('dismissed')
      }, h('span', {}, '×'))
    ]) : null;
  }
});

// BButtonGroup
export const BButtonGroup = defineComponent({
  name: 'BButtonGroup',
  props: {
    size: String,
  },
  setup(props, { slots }) {
    return () => h('div', {
      class: ['btn-group', props.size && `btn-group-${props.size}`].filter(Boolean),
      role: 'group'
    }, slots.default?.());
  }
});

// BButtonToolbar
export const BButtonToolbar = defineComponent({
  name: 'BButtonToolbar',
  setup(props, { slots }) {
    return () => h('div', {
      class: 'btn-toolbar',
      role: 'toolbar'
    }, slots.default?.());
  }
});

// BDropdownText
export const BDropdownText = defineComponent({
  name: 'BDropdownText',
  setup(props, { slots }) {
    return () => h('span', { class: 'dropdown-item-text' }, slots.default?.());
  }
});

export const BDropdownItemButton = defineComponent({
  name: 'BDropdownItemButton',
  setup(props, { slots, attrs }) {
    return () => h('button', {
      ...attrs,
      class: 'dropdown-item',
      type: 'button'
    }, slots.default?.());
  }
});

export const BDropdownDivider = defineComponent({
  name: 'BDropdownDivider',
  setup() {
    return () => h('div', { class: 'dropdown-divider' });
  }
});

export const BDropdownForm = defineComponent({
  name: 'BDropdownForm',
  setup(props, { slots }) {
    return () => h('form', { class: 'px-4 py-3' }, slots.default?.());
  }
});

// BFormTextarea
export const BFormTextarea = defineComponent({
  name: 'BFormTextarea',
  props: {
    modelValue: String,
    rows: Number,
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('textarea', {
      ...attrs,
      class: 'form-control',
      rows: props.rows || 3,
      value: props.modelValue,
      placeholder: props.placeholder,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
    });
  }
});

// BFormRadio
export const BFormRadio = defineComponent({
  name: 'BFormRadio',
  props: {
    modelValue: {},
    value: {},
    name: String,
  },
  emits: ['update:modelValue'],
  setup(props, { slots, emit }) {
    return () => h('div', { class: 'form-check' }, [
      h('input', {
        class: 'form-check-input',
        type: 'radio',
        name: props.name,
        checked: props.modelValue === props.value,
        onChange: () => emit('update:modelValue', props.value)
      }),
      h('label', { class: 'form-check-label' }, slots.default?.())
    ]);
  }
});

// BFormRadioGroup
export const BFormRadioGroup = defineComponent({
  name: 'BFormRadioGroup',
  props: {
    modelValue: {},
    options: Array as PropType<any[]>,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    return () => h('div', {}, slots.default?.() || props.options?.map(option =>
      h(BFormRadio, {
        modelValue: props.modelValue,
        value: typeof option === 'string' ? option : option.value,
        'onUpdate:modelValue': (val: any) => emit('update:modelValue', val)
      }, () => typeof option === 'string' ? option : option.text)
    ));
  }
});

// BFormSelect
export const BFormSelect = defineComponent({
  name: 'BFormSelect',
  props: {
    modelValue: {},
    options: Array as PropType<any[]>,
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('select', {
      ...attrs,
      class: 'form-control',
      value: props.modelValue,
      onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value)
    }, props.options?.map(option =>
      h('option', {
        value: typeof option === 'string' ? option : option.value
      }, typeof option === 'string' ? option : option.text)
    ));
  }
});

// BForm
export const BForm = defineComponent({
  name: 'BForm',
  setup(props, { slots, attrs }) {
    return () => h('form', attrs, slots.default?.());
  }
});

// BFormDatepicker - Simple date input (not a full datepicker)
export const BFormDatepicker = defineComponent({
  name: 'BFormDatepicker',
  props: {
    modelValue: [String, Date],
    size: String, // Accept size prop but don't use it
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    const formatDate = (value: string | Date | undefined) => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      // Convert Date to YYYY-MM-DD format
      const date = value as Date;
      return date.toISOString().split('T')[0];
    };

    // Remove 'size' from attrs as it's not valid for date inputs
    const { size, ...validAttrs } = attrs as any;

    return () => h('input', {
      ...validAttrs,
      class: ['form-control', props.size && `form-control-${props.size}`].filter(Boolean).join(' '),
      type: 'date',
      value: formatDate(props.modelValue),
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    });
  }
});

// BFormTimepicker - Simple time input (not a full timepicker)
export const BFormTimepicker = defineComponent({
  name: 'BFormTimepicker',
  props: {
    modelValue: String,
    size: String, // Accept size prop but don't use it
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    // Remove 'size' from attrs as it's not valid for time inputs
    const { size, ...validAttrs } = attrs as any;

    return () => h('input', {
      ...validAttrs,
      class: ['form-control', props.size && `form-control-${props.size}`].filter(Boolean).join(' '),
      type: 'time',
      value: props.modelValue,
      onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    });
  }
});

// BButton
export const BButton = defineComponent({
  name: 'BButton',
  props: {
    variant: String,
    size: String,
    disabled: Boolean,
  },
  setup(props, { slots, attrs }) {
    return () => h('button', {
      ...attrs,
      class: [
        'btn',
        props.variant ? `btn-${props.variant}` : 'btn-secondary',
        props.size && `btn-${props.size}`
      ].filter(Boolean),
      disabled: props.disabled,
      type: (attrs as any).type || 'button'
    }, slots.default?.());
  }
});

// BSpinner
export const BSpinner = defineComponent({
  name: 'BSpinner',
  props: {
    small: Boolean,
    variant: String,
  },
  setup(props) {
    return () => h('div', {
      class: [
        'spinner-border',
        props.small && 'spinner-border-sm',
        props.variant && `text-${props.variant}`
      ].filter(Boolean),
      role: 'status'
    }, [h('span', { class: 'sr-only' }, 'Loading...')]);
  }
});

// BBreadcrumb
export const BBreadcrumb = defineComponent({
  name: 'BBreadcrumb',
  props: {
    items: {
      type: Array as PropType<Array<{
        text?: string;
        to?: any;
        active?: boolean;
      }>>,
      default: () => []
    }
  },
  setup(props, { slots }) {
    return () => {
      const RouterLink = resolveComponent('RouterLink');

      const children = props.items.length > 0
        ? props.items.map((item, index) => {
            const isActive = item.active !== undefined ? item.active : index === props.items.length - 1;
            const liClass = isActive ? 'breadcrumb-item active' : 'breadcrumb-item';

            if (item.to) {
              // Return breadcrumb item with router-link
              return h('li', { class: liClass }, [
                h(RouterLink, { to: item.to }, () => item.text)
              ]);
            } else {
              // Return breadcrumb item with span
              return h('li', { class: liClass }, [
                h('span', { 'aria-current': isActive ? 'location' : undefined }, item.text)
              ]);
            }
          })
        : slots.default?.();

      return h('nav', { 'aria-label': 'breadcrumb' }, [
        h('ol', { class: 'breadcrumb' }, children)
      ]);
    };
  }
});

// Vue 3 Directives
import type { Directive, DirectiveBinding } from 'vue';

// VBModal directive - triggers modal show when clicked
export const VBModal: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.addEventListener('click', () => {
      // Support both v-b-modal="'modalId'" and v-b-modal.modalId syntax
      const modalId = binding.value || Object.keys(binding.modifiers)[0];
      console.log('[VBModal] Looking for modal with ID:', modalId);
      const modalEl = document.getElementById(modalId);
      console.log('[VBModal] Modal element found:', modalEl);
      if (modalEl) {
        // Trigger modal show - in a real app you'd use Bootstrap's modal API
        // For now, just dispatch a custom event that the modal can listen to
        const event = new CustomEvent('show-modal', { detail: { modalId } });
        console.log('[VBModal] Dispatching show-modal event');
        modalEl.dispatchEvent(event);
      } else {
        // If modal element not found (lazy mount), dispatch global event
        console.log('[VBModal] Modal element not found, dispatching global event for', modalId);
        const globalEvent = new CustomEvent('show-modal-global', {
          detail: { modalId },
          bubbles: true,
          composed: true
        });
        document.dispatchEvent(globalEvent);
      }
    });
  }
};

// VBToggle directive - toggles collapse visibility
export const VBToggle: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.addEventListener('click', () => {
      const targetId = binding.value;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.toggle('show');
      }
    });
  }
};

// Export all as named exports
export default {
  // Icons
  BIconBullseye,
  BIconBuilding,
  BIconInfoCircle,
  BIconExclamationTriangle,
  BIconShield,
  BIconX,
  BIconHouse,
  BIconEnvelope,
  BIconLightning,
  BIconLightningFill,
  BIconPlusCircle,
  BIconThreeDotsVertical,
  BIconXCircle,
  BIconChevronDoubleLeft,
  BIconFullscreen,
  BIconFullscreenExit,
  BIconList,
  BIconZoomIn,
  BIconLink,
  BIconMap,
  BIconPhone,
  BIconClock,
  BIconFileDiff,
  BIconPlus,
  BIconDownload,
  BIconChevronRight,
  BIconChevronDown,
  BIconChevronUp,
  BIconChevronLeft,
  BIconGearWide,
  BIconGear,
  BIconSearch,
  BIconPencil,
  BIconBroadcast,
  BIconCalendar,
  BIconBell,
  BIconCode,
  BIconNewspaper,
  BIconQuestionCircle,
  BIconClipboard,
  BIconGlobe,
  BIconStar,
  BIconStarFill,
  BIconInfoCircleFill,
  BIconCheckCircleFill,
  BIconExclamationCircleFill,
  BIconArrowClockwise,
  BIconArrowCounterclockwise,
  BIconPerson,
  BIconEnvelopeFill,
  BIconExclamation,
  BIconQuestionCircleFill,
  BIconUpload,
  BIconPauseFill,
  BIconPlayFill,
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,

  // Components
  BModal,
  BTable,
  BFormGroup,
  BFormInput,
  BFormCheckbox,
  BDropdown,
  BDropdownItem,
  BDropdownHeader,
  BDropdownText,
  BPagination,
  BListGroup,
  BListGroupItem,
  BCard,
  BCardHeader,
  BCardBody,
  BIcon,
  BCollapse,
  BBadge,
  BAlert,
  BButtonGroup,
  BButtonToolbar,
  BFormTextarea,
  BFormRadio,
  BFormRadioGroup,
  BFormSelect,
  BForm,
  BFormDatepicker,
  BFormTimepicker,
  BButton,
  BSpinner,
  BBreadcrumb,
  BDropdownItemButton,
  BDropdownDivider,
  BDropdownForm,

  // Directives
  VBModal,
  VBToggle,
};
