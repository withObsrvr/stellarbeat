import { reactive, Component } from "vue";

interface InfoBoxState {
  isOpen: boolean;
  component: Component | null;
}

class InfoBoxStore {
  private _state: InfoBoxState = reactive({
    isOpen: false,
    component: null,
  });

  public show(component: Component) {
    this._state.component = component;
    this._state.isOpen = true;
  }

  public hide() {
    this._state.isOpen = false;
    this._state.component = null;
  }

  public get state() {
    return this._state;
  }
}

export const infoBoxStore = new InfoBoxStore();
