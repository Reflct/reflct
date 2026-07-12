import type { AppBase } from "playcanvas";

export function requestRender(app: AppBase | null | undefined): void {
  if (app) {
    app.renderNextFrame = true;
  }
}
