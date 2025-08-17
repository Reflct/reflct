import * as pc from "playcanvas";
import { getCameraInstance } from "./camera-controls";

export type HitPointEvents = {
  hitPointUpdate: {
    id: string;
    screenX: number;
    screenY: number;
    worldPosition: pc.Vec3;
    isVisible: boolean;
  };
};

// Custom event emitter for hit points
class HitPointEventEmitter {
  private listeners: {
    [id: string]: ((data: HitPointEvents["hitPointUpdate"]) => void)[];
  } = {};

  on(
    id: string,
    callback: (data: HitPointEvents["hitPointUpdate"]) => void
  ): void {
    this.listeners[id] = [...(this.listeners[id] || []), callback];
  }

  off(
    id: string,
    callback: (data: HitPointEvents["hitPointUpdate"]) => void
  ): void {
    this.listeners[id] = this.listeners[id]?.filter(
      (_callback) => _callback !== callback
    );
  }

  emit(data: HitPointEvents["hitPointUpdate"]): void {
    this.listeners[data.id]?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in hit point event handler for ${event}:`, error);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners = {};
  }
}

const hitPointInstances = new Map<string, HitPointsScript>();
export const getHitPointInstance = (name: string) => {
  return hitPointInstances.get(name);
};

export class HitPointsScript extends pc.Script {
  private hitPoints: Map<string, pc.Vec3> = new Map();
  private hitPointEventEmitter = new HitPointEventEmitter();

  initialize() {
    hitPointInstances.set(this.entity.name, this);
    this.app.on("cameraUpdate", this.onCameraUpdate.bind(this));
  }

  destroy() {
    this.app.off("cameraUpdate", this.onCameraUpdate.bind(this));
    hitPointInstances.delete(this.entity.name);
  }

  /**
   * Add a hit point to track
   * @param id Unique identifier for the hit point
   * @param worldPosition 3D world position
   */
  addHitPoint(
    id: string,
    worldPosition: pc.Vec3,
    onCameraUpdate: (data: HitPointEvents["hitPointUpdate"]) => void
  ): void {
    this.hitPoints.set(id, worldPosition.clone());

    // Listen for camera updates using custom event emitter
    this.hitPointEventEmitter.on(id, onCameraUpdate);

    this.updateHitPoint(id);
  }

  /**
   * Remove a hit point
   * @param id Unique identifier for the hit point
   */
  removeHitPoint(
    id: string,
    onCameraUpdate?: (data: HitPointEvents["hitPointUpdate"]) => void
  ): void {
    this.hitPoints.delete(id);
    // Dispatch event to remove the element using custom event emitter
    this.hitPointEventEmitter.emit({
      id,
      screenX: 0,
      screenY: 0,
      worldPosition: new pc.Vec3(),
      isVisible: false,
    });

    if (onCameraUpdate) {
      this.hitPointEventEmitter.off(id, onCameraUpdate);
    }
  }

  /**
   * Update a hit point's world position
   * @param id Unique identifier for the hit point
   * @param worldPosition New 3D world position
   */
  updateHitPointPosition(id: string, worldPosition: pc.Vec3): void {
    this.hitPoints.set(id, worldPosition.clone());
    this.updateHitPoint(id);
  }

  /**
   * Clear all hit points
   */
  clearHitPoints(): void {
    const ids = Array.from(this.hitPoints.keys());
    ids.forEach((id) => this.removeHitPoint(id));
    this.hitPoints.clear();
  }

  /**
   * Get all current hit points
   */
  getHitPoints(): Map<string, pc.Vec3> {
    return new Map(this.hitPoints);
  }

  /**
   * Handle camera updates
   */
  private onCameraUpdate(): void {
    // Update all hit points when camera changes
    this.hitPoints.forEach((worldPosition, id) => {
      this.updateHitPoint(id);
    });
  }

  /**
   * Update a specific hit point's screen coordinates
   * @param id Hit point identifier
   */
  private updateHitPoint(id: string): void {
    const worldPosition = this.hitPoints.get(id);
    if (!worldPosition) return;

    const sceneId = this.entity.name.replace("hitpoints-", "");
    const cameraInstance = getCameraInstance(`camera-${sceneId}`);
    if (!cameraInstance || !cameraInstance.entity.camera) return;

    const camera = cameraInstance.entity.camera;
    const cameraPosition = cameraInstance.entity.getPosition();

    // Transform world position to screen coordinates
    const screenPos = new pc.Vec3();
    camera.worldToScreen(worldPosition, screenPos);

    // Check if point is visible (in front of camera)
    const toPoint = new pc.Vec3();
    toPoint.sub2(worldPosition, cameraPosition);
    const forward = new pc.Vec3();
    forward.sub2(cameraInstance.getLookAt(), cameraPosition).normalize();

    const isVisible = toPoint.dot(forward) > 0;

    // Dispatch event for React to update the element using custom event emitter
    this.hitPointEventEmitter.emit({
      id,
      screenX: screenPos.x,
      screenY: screenPos.y,
      worldPosition: worldPosition.clone(),
      isVisible,
    });
  }

  /**
   * Force update all hit points
   */
  forceUpdate(): void {
    this.onCameraUpdate();
  }
}
