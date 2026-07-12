// Camera controls to implement
import * as pc from "playcanvas";
import { Keyboard, Mouse, Script as PcScript, Vec3 } from "playcanvas";

// TODO: we can set the base azimuthAngle.
// this will upate getShortestPathAzimuthAngle to be relative to the base azimuthAngle
// this will make the camera to be rotated 360 around the base azimuth angle

export type CameraEvents = {
  targetPositionChanged: { position: Vec3 };
  targetLookAtChanged: { lookAt: Vec3 };
  targetZoomChanged: { zoom: number };
  positionChanged: { position: Vec3 };
  lookAtChanged: { lookAt: Vec3 };
};

const cameraInstances = new Map<string, CameraControlsScript>();
export const getCameraInstance = (name: string) => {
  return cameraInstances.get(name);
};

export class CameraControlsScript extends PcScript {
  private static readonly MAX_SPLAT_PICK_SAMPLES = 16384;

  private canvas!: HTMLCanvasElement;
  private keyboard!: Keyboard;

  private _pickRayDir = new Vec3();
  private _pickLocalPos = new Vec3();
  private _pickWorldPos = new Vec3();
  private _pickResult = new Vec3();

  private isMouseDown: boolean = false;
  private isDragging: boolean = false;
  private isPanning: boolean = false;

  private lastX: number = 0;
  private lastY: number = 0;
  private mouseDownX: number = 0;
  private mouseDownY: number = 0;
  private hasMoved: boolean = false;
  private minDistance: number = 0.001;
  private maxDistance: number = Infinity;

  private isLockedForOrbit: boolean = true;

  private basePolarAngle: number = Math.PI / 2;
  private minPolarAngle: number = Math.PI / 2;
  private maxPolarAngle: number = Math.PI / 2;

  private baseAzimuthAngle: number = 0;
  private minAzimuthAngle: number = -Infinity;
  private maxAzimuthAngle: number = Infinity;

  private minZoom: number = 0.8;
  private maxZoom: number = 1.2;
  private lerpFactor: number = 0.1;
  private panSpeed: number = 0.01;
  private zoomSpeed: number = 0.1;

  private wheelZoomSpeed: number = 0.001;
  private dragRotationSpeed: number = 0.002;

  private arrowPanSpeed: number = 20;
  private rotateSpeed: number = 1.5;
  private focused: boolean = false;

  private controlsDisabled: boolean = false;
  private zoomDisabled: boolean = false;
  private panDisabled: boolean = true;
  private rotateDisabled: boolean = false;

  // Auto-rotation properties
  private autoRotate: boolean = true;
  private autoRotateSpeed: number = 0.01; // radians per second (will be calculated dynamically)
  private userHasInteracted: boolean = false;
  private autoRotateDirection: number = 1; // 1 for clockwise, -1 for counter-clockwise
  private autoRotatePolarSpeed: number = 0.02; // radians per second (will be calculated dynamically)
  private autoRotatePolarDirection: number = 1; // 1 for up, -1 for down
  private lastAzimuthAngle: number = 0;
  private lastPolarAngle: number = 0;
  private angleChangeTime: number = 0;
  private angleChangeThreshold: number = 0; // seconds to wait before changing direction
  private autoRotateDuration: number = 15; // seconds to reach min/max angles
  private autoRotationMinMaxAzimuthAngle: number = Math.PI / 45; // radians to reach min/max angles
  private autoRotationMinMaxPolarAngle: number = Math.PI / 90; // radians to reach min/max angles

  private mouseDownHandler: (event: MouseEvent) => void = () => {};
  private mouseMoveHandler: (event: MouseEvent) => void = () => {};
  private mouseUpHandler: (event: MouseEvent) => void = () => {};
  private mouseWheelHandler: (event: WheelEvent) => void = () => {};

  private focusHandler: (event: MouseEvent) => void = () => {};
  private contextMenuHandler: (event: MouseEvent) => void = () => {};

  // Touch event handlers for preventing scroll
  private touchStartHandler: (event: TouchEvent) => void = () => {};
  private touchMoveHandler: (event: TouchEvent) => void = () => {};
  private touchEndHandler: (event: TouchEvent) => void = () => {};

  // Touch state for pinch zoom
  private touches: Touch[] = [];
  private initialPinchDistance: number = 0;
  private initialPinchZoom: number = 1;
  private initialPinchDistance2: number = 0;

  // Event system properties
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private lastEmittedValues: {
    targetPosition: Vec3;
    targetLookAt: Vec3;
    targetZoom: number;
    position: Vec3;
    lookAt: Vec3;
    zoom: number;
  } | null = null;

  private target = {
    distance: 45,
    polarAngle: 1.2,
    azimuthAngle: 2.4,
    lookat: new Vec3(0, 0, 0),
    zoom: 1,
  };

  private real = {
    distance: 45,
    polarAngle: 1.2,
    azimuthAngle: 2.4,
    lookat: new Vec3(0, 0, 0),
    zoom: 1,
  };

  initialize() {
    this.keyboard = this.app.keyboard!;
    this.canvas = this.app.graphicsDevice.canvas;

    this.mouseDownHandler = this.onMouseDown.bind(this);
    this.mouseMoveHandler = this.onMouseMove.bind(this);
    this.mouseUpHandler = this.onMouseUp.bind(this);
    this.mouseWheelHandler = this.onMouseWheel.bind(this);
    this.contextMenuHandler = this.onContextMenu.bind(this);

    this.touchStartHandler = this.onTouchStart.bind(this);
    this.touchMoveHandler = this.onTouchMove.bind(this);
    this.touchEndHandler = this.onTouchEnd.bind(this);

    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    window.addEventListener("mousemove", this.mouseMoveHandler);
    window.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("wheel", this.mouseWheelHandler);
    this.canvas.addEventListener("contextmenu", this.contextMenuHandler);

    // Add touch event listeners
    this.canvas.addEventListener("touchstart", this.touchStartHandler, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.touchMoveHandler, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.touchEndHandler, {
      passive: false,
    });

    this.focusHandler = this.onWindowClick.bind(this);
    window.addEventListener("click", this.focusHandler);

    this.setTargetLookAt(new Vec3(0, 1, 1));
    this.setTargetPosition(new Vec3(0, 0, 0));
    this.setTargetZoom(1);

    // Calculate initial dynamic speeds
    this.calculateDynamicSpeeds();

    // Set initial camera position
    this.updateCameraPosition();

    // Initialize last emitted values
    this.lastEmittedValues = {
      targetPosition: this.getTargetPosition(),
      targetLookAt: this.getTargetLookAt(),
      targetZoom: this.getTargetZoom(),
      position: this.getPosition(),
      lookAt: this.getLookAt(),
      zoom: this.getZoom(),
    };

    this.autoRotateDirection = Math.random() > 0.5 ? 1 : -1;
    this.autoRotatePolarDirection = Math.random() > 0.5 ? 1 : -1;

    cameraInstances.set(this.entity.name, this);

    this.requestRender();
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this.mouseDownHandler);
    window.removeEventListener("pointermove", this.mouseMoveHandler);
    window.removeEventListener("pointerup", this.mouseUpHandler);
    this.canvas.removeEventListener("wheel", this.mouseWheelHandler);
    this.canvas.removeEventListener("contextmenu", this.contextMenuHandler);

    // // Remove touch event listeners
    // this.canvas.removeEventListener("touchstart", this.touchStartHandler);
    // this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
    // this.canvas.removeEventListener("touchend", this.touchEndHandler);

    window.removeEventListener("click", this.focusHandler);

    cameraInstances.delete(this.entity.name);
  }

  /**
   * Add an event listener for camera events
   * @param eventName The name of the event to listen for
   * @param callback The callback function to execute when the event is triggered
   */
  addCameraEventListener<T extends keyof CameraEvents>(
    eventName: T,
    callback: (data: CameraEvents[T]) => void
  ): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(callback);
  }

  /**
   * Remove an event listener
   * @param eventName The name of the event
   * @param callback The callback function to remove
   */
  removeCameraEventListener<T extends keyof CameraEvents>(
    eventName: T,
    callback: (data: CameraEvents[T]) => void
  ): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventName);
      }
    }
  }

  /**
   * Emit an event with data
   * @param eventName The name of the event to emit
   * @param data The data to pass to the event listeners
   */
  private emit(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Check if camera values have changed and emit events if they have
   */
  private checkAndEmitCameraEvents(): void {
    if (!this.lastEmittedValues) return;

    const currentTargetPosition = this.getTargetPosition();
    const currentTargetLookAt = this.getTargetLookAt();
    const currentTargetZoom = this.getTargetZoom();
    const currentPosition = this.getPosition();
    const currentLookAt = this.getLookAt();
    const currentZoom = this.getZoom();

    const hasTargetPositionChanged = !this.vec3Equals(
      currentTargetPosition,
      this.lastEmittedValues.targetPosition
    );
    const hasTargetLookAtChanged = !this.vec3Equals(
      currentTargetLookAt,
      this.lastEmittedValues.targetLookAt
    );
    const hasTargetZoomChanged =
      Math.abs(currentTargetZoom - this.lastEmittedValues.targetZoom) > 0.001;
    const hasPositionChanged = !this.vec3Equals(
      currentPosition,
      this.lastEmittedValues.position
    );
    const hasLookAtChanged = !this.vec3Equals(
      currentLookAt,
      this.lastEmittedValues.lookAt
    );
    const hasZoomChanged =
      Math.abs(currentZoom - this.lastEmittedValues.zoom) > 0.001;

    // Check if target values have changed
    if (hasTargetPositionChanged) {
      this.emit("targetPositionChanged", { position: currentTargetPosition });
      this.lastEmittedValues.targetPosition = currentTargetPosition.clone();
    }

    if (hasTargetLookAtChanged) {
      this.emit("targetLookAtChanged", { lookAt: currentTargetLookAt });
      this.lastEmittedValues.targetLookAt = currentTargetLookAt.clone();
    }

    if (hasTargetZoomChanged) {
      this.emit("targetZoomChanged", { zoom: currentTargetZoom });
      this.lastEmittedValues.targetZoom = currentTargetZoom;
    }

    // Check if current values have changed
    if (hasPositionChanged) {
      this.emit("positionChanged", { position: currentPosition });
      this.lastEmittedValues.position = currentPosition.clone();
    }

    if (hasLookAtChanged) {
      this.emit("lookAtChanged", { lookAt: currentLookAt });
      this.lastEmittedValues.lookAt = currentLookAt.clone();
    }

    if (hasZoomChanged) {
      this.emit("zoomChanged", { zoom: currentZoom });
      this.lastEmittedValues.zoom = currentZoom;
    }

    if (hasPositionChanged || hasLookAtChanged || hasZoomChanged) {
      // Emit a general camera update event
      this.emit("cameraUpdate", {
        target: {
          position: currentTargetPosition,
          lookAt: currentTargetLookAt,
          zoom: currentTargetZoom,
        },
        current: {
          position: currentPosition,
          lookAt: currentLookAt,
          zoom: currentZoom,
        },
      });

      this.app.fire("cameraUpdate", {
        target: {
          position: currentTargetPosition,
          lookAt: currentTargetLookAt,
          zoom: currentTargetZoom,
        },
        current: {
          position: currentPosition,
          lookAt: currentLookAt,
          zoom: currentZoom,
        },
      });
    }
  }

  /**
   * Helper method to compare two Vec3 objects
   */
  private vec3Equals(a: Vec3, b: Vec3): boolean {
    return (
      Math.abs(a.x - b.x) < 0.001 &&
      Math.abs(a.y - b.y) < 0.001 &&
      Math.abs(a.z - b.z) < 0.001
    );
  }

  private requestRender(): void {
    this.app.renderNextFrame = true;
  }

  private isCameraAnimating(): boolean {
    const epsilon = 0.001;

    if (Math.abs(this.real.zoom - this.target.zoom) > epsilon) return true;
    if (Math.abs(this.real.polarAngle - this.target.polarAngle) > epsilon)
      return true;
    if (Math.abs(this.real.azimuthAngle - this.target.azimuthAngle) > epsilon)
      return true;
    if (Math.abs(this.real.distance - this.target.distance) > epsilon)
      return true;
    if (!this.vec3Equals(this.real.lookat, this.target.lookat)) return true;

    return false;
  }

  private shouldRenderThisFrame(): boolean {
    return (
      this.isCameraAnimating() ||
      (this.isMouseDown && (this.isDragging || this.isPanning)) ||
      (this.autoRotate && !this.userHasInteracted && !this.controlsDisabled)
    );
  }

  private onWindowClick(event: MouseEvent) {
    try {
      if (this.app.graphicsDevice.canvas.contains(event.target as Node)) {
        this.focused = true;
      } else {
        this.focused = false;
      }
    } catch {}
  }

  private onMouseWheel(event: WheelEvent) {
    // Don't handle wheel events if controls are disabled
    if (this.controlsDisabled || this.zoomDisabled) return;

    // Stop auto-rotation on wheel interaction
    this.userHasInteracted = true;
    this.autoRotate = false;

    // Adjust distance based on wheel delta
    const delta = event.deltaY * this.wheelZoomSpeed;
    this.target.zoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.target.zoom - delta)
    );

    event.preventDefault();
    this.requestRender();
  }

  private onMouseDown(event: MouseEvent) {
    event.preventDefault();

    // Don't handle mouse events if controls are disabled
    if (this.controlsDisabled) return;

    this.isMouseDown = true;
    this.userHasInteracted = true;
    this.autoRotate = false;

    if (event.button === pc.MOUSEBUTTON_LEFT) {
      // Left mouse button - rotate
      this.isDragging = true;
      this.lastX = event.x;
      this.lastY = event.y;
      this.mouseDownX = event.x;
      this.mouseDownY = event.y;
      this.hasMoved = false;
    }
    // else if (event.button === pc.MOUSEBUTTON_RIGHT) {
    //   // Right mouse button - pan
    //   this.isPanning = true;
    //   this.lastX = event.x;
    //   this.lastY = event.y;
    //   this.mouseDownX = event.x;
    //   this.mouseDownY = event.y;
    //   this.hasMoved = false;
    // }
  }

  private onMouseMove(event: MouseEvent) {
    event.preventDefault();

    this.onInteractionMove({ x: event.x, y: event.y });
  }

  private onMouseUp(event: MouseEvent) {
    event.preventDefault();

    this.onInteractionEnd({ x: event.clientX, y: event.clientY });
  }

  private onContextMenu(event: MouseEvent) {
    event.preventDefault();
  }

  private onTouchStart(event: TouchEvent) {
    event.preventDefault();

    if (this.controlsDisabled) return;

    this.touches = Array.from(event.touches);
    this.userHasInteracted = true;
    this.autoRotate = false;

    if (this.touches.length === 2) {
      // Two-finger pinch zoom
      const dx = this.touches[0].clientX - this.touches[1].clientX;
      const dy = this.touches[0].clientY - this.touches[1].clientY;
      this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);

      // Store initial distance for camera distance adjustment
      this.initialPinchDistance2 = this.target.distance;

      // Store initial zoom
      this.initialPinchZoom = this.target.zoom;

      // Reset dragging state when starting pinch
      this.isDragging = false;
      this.isMouseDown = false;
    } else if (this.touches.length === 1) {
      // Single finger - prepare for rotation
      this.isMouseDown = true;
      this.isDragging = true;
      this.lastX = this.touches[0].clientX;
      this.lastY = this.touches[0].clientY;
      this.mouseDownX = this.touches[0].clientX;
      this.mouseDownY = this.touches[0].clientY;
      this.hasMoved = false;
    }
  }

  private onTouchMove(event: TouchEvent) {
    event.preventDefault();

    this.touches = Array.from(event.touches);

    if (this.touches.length === 2) {
      // Two-finger pinch zoom
      const dx = this.touches[0].clientX - this.touches[1].clientX;
      const dy = this.touches[0].clientY - this.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      if (this.initialPinchDistance > 0 && !this.zoomDisabled) {
        const scale = currentDistance / this.initialPinchDistance;

        // Apply pinch zoom - adjust zoom level
        const newZoom = this.initialPinchZoom * scale;
        this.target.zoom = Math.max(
          this.minZoom,
          Math.min(this.maxZoom, newZoom)
        );
      }
    } else if (this.touches.length === 1 && this.isDragging) {
      // Single finger drag - rotate camera
      this.onInteractionMove({
        x: this.touches[0].clientX,
        y: this.touches[0].clientY,
      });
    }

    this.requestRender();
  }

  private onTouchEnd(event: TouchEvent) {
    event.preventDefault();

    this.touches = Array.from(event.touches);

    if (this.touches.length === 0) {
      // All fingers lifted
      this.isDragging = false;
      this.isPanning = false;
      this.initialPinchDistance = 0;
      this.initialPinchDistance2 = 0;
      this.initialPinchZoom = 1;

      // Handle tap to focus on splat
      if (
        !this.hasMoved &&
        !this.isLockedForOrbit &&
        event.changedTouches.length > 0
      ) {
        const touch = event.changedTouches[0];
        this.onInteractionEnd({
          x: touch.clientX,
          y: touch.clientY,
        });
      } else {
        this.isMouseDown = false;
      }

      this.hasMoved = false;
    } else if (this.touches.length === 1) {
      // One finger remaining, reset to single touch mode
      this.initialPinchDistance = 0;
      this.initialPinchDistance2 = 0;
      this.initialPinchZoom = 1;
      this.lastX = this.touches[0].clientX;
      this.lastY = this.touches[0].clientY;
      this.isDragging = true;
      this.isMouseDown = true;
    }

    this.requestRender();
  }

  private onInteractionMove(value: { x: number; y: number }) {
    if (!this.isMouseDown) return;
    if (!this.isDragging && !this.isPanning) return;

    const deltaX = value.x - this.lastX;
    const deltaY = value.y - this.lastY;

    if (this.isDragging) {
      // Update target angles with reduced sensitivity and inverted direction
      this.target.azimuthAngle -= deltaX * this.dragRotationSpeed;
      this.target.polarAngle -= deltaY * this.dragRotationSpeed;

      // Clamp target azimuth angle
      this.clampTargetAzimuthAngle();
      this.clampTargetPolarAngle();
    } else if (this.isPanning) {
      // Calculate pan amount
      const panX = deltaX * this.panSpeed;
      const panY = deltaY * this.panSpeed;

      // Calculate pan direction based on current camera orientation
      const forward = new Vec3();
      const right = new Vec3();
      const up = new Vec3(0, 1, 0);

      // Get forward vector (from camera to lookat)
      forward.sub2(this.real.lookat, this.entity.getPosition()).normalize();

      // Calculate right vector (cross product of up and forward)
      right.cross(up, forward).normalize();

      // Update lookat offset - use right for X movement and up for Y movement
      this.target.lookat.x += right.x * panX;
      this.target.lookat.y += panY; // Direct Y movement
      this.target.lookat.z += right.z * panX;
    }

    this.lastX = value.x;
    this.lastY = value.y;

    if (
      Math.abs(value.x - this.mouseDownX) > 2 ||
      Math.abs(value.y - this.mouseDownY) > 2
    ) {
      this.hasMoved = true;
    }

    this.requestRender();
  }

  private onInteractionEnd(value: { x: number; y: number }) {
    if (!this.isMouseDown) return;

    this.isMouseDown = false;
    this.isDragging = false;
    this.isPanning = false;

    if (this.isLockedForOrbit) return;

    if (!this.hasMoved) {
      this.focusCameraOnScreenPosition(value.x, value.y);
    }

    this.hasMoved = false;
    this.requestRender();
  }

  private focusCameraOnScreenPosition(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const closestPosition = this.selectSplat({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });

    if (!closestPosition) return;

    const direction = new pc.Vec3();
    direction.sub2(this.entity.getPosition(), closestPosition).normalize();

    const newAzimuthAngle =
      (Math.atan2(direction.x, direction.z) - Math.PI / 2) % (2 * Math.PI);

    this.target.azimuthAngle = this.getShortestPathAzimuthAngle(
      this.real.azimuthAngle,
      newAzimuthAngle
    );
    this.target.polarAngle = Math.acos(direction.y) % Math.PI;
    this.target.distance = this.entity.getPosition().distance(closestPosition);
    this.target.lookat.copy(closestPosition);

    this.requestRender();
  }

  private selectSplat({ x, y }: { x: number; y: number }): pc.Vec3 | null {
    if (!this.entity.camera) return null;

    const from = this.entity.getPosition();
    const to = this.entity.camera.screenToWorld(
      x,
      y,
      this.entity.camera.farClip
    );

    this._pickRayDir.sub2(to, from).normalize();

    const fromX = from.x;
    const fromY = from.y;
    const fromZ = from.z;
    const rdx = this._pickRayDir.x;
    const rdy = this._pickRayDir.y;
    const rdz = this._pickRayDir.z;

    let closestDistSq = Infinity;
    let hasClosest = false;

    const components = this.app.root.findComponents("gsplat");
    for (const component of components) {
      const gsplatComponent = component as pc.GSplatComponent;
      const resource = gsplatComponent.resource;

      if (!resource?.centers) continue;

      const { centers } = resource;
      const numSplats = resource.numSplats;
      const step = Math.max(
        1,
        Math.ceil(numSplats / CameraControlsScript.MAX_SPLAT_PICK_SAMPLES)
      );
      const worldTransform = gsplatComponent.entity.getWorldTransform();

      for (let i = 0; i < numSplats; i += step) {
        this._pickLocalPos.set(
          centers[i * 3],
          centers[i * 3 + 1],
          centers[i * 3 + 2]
        );
        worldTransform.transformPoint(this._pickLocalPos, this._pickWorldPos);

        const wx = this._pickWorldPos.x;
        const wy = this._pickWorldPos.y;
        const wz = this._pickWorldPos.z;

        const tsx = wx - fromX;
        const tsy = wy - fromY;
        const tsz = wz - fromZ;
        const projectionLength = tsx * rdx + tsy * rdy + tsz * rdz;

        if (projectionLength <= 0) continue;

        const cx = fromX + rdx * projectionLength;
        const cy = fromY + rdy * projectionLength;
        const cz = fromZ + rdz * projectionLength;

        const dx = wx - cx;
        const dy = wy - cy;
        const dz = wz - cz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          this._pickResult.set(wx, wy, wz);
          hasClosest = true;
        }
      }
    }

    return hasClosest ? this._pickResult.clone() : null;
  }

  /**
   * Normalizes an angle to the range [-π, π] and ensures the shortest path
   * when transitioning between angles that wrap around the circle.
   */
  private normalizeAzimuthAngle(angle: number): number {
    // Normalize to [-π, π] range
    let normalized = angle % (2 * Math.PI);
    if (normalized > Math.PI) {
      normalized -= 2 * Math.PI;
    } else if (normalized < -Math.PI) {
      normalized += 2 * Math.PI;
    }
    return normalized;
  }

  /**
   * Ensures the shortest path when transitioning from current to target azimuth angle.
   * This prevents the camera from rotating 360 degrees when it should rotate 2 degrees.
   */
  private getShortestPathAzimuthAngle(current: number, target: number): number {
    // Normalize both angles to [-π, π]
    const normalizedCurrent = this.normalizeAzimuthAngle(current);
    const normalizedTarget = this.normalizeAzimuthAngle(target);

    // Calculate the difference
    let diff = normalizedTarget - normalizedCurrent;

    // If the difference is greater than π, we need to go the other way
    if (diff > Math.PI) {
      diff -= 2 * Math.PI;
    } else if (diff < -Math.PI) {
      diff += 2 * Math.PI;
    }

    // Return the current angle plus the shortest path difference
    return current + diff;
  }

  private updateCameraPosition() {
    const camera = this.entity.camera;
    if (!camera) return;

    // Calculate camera position from spherical coordinates relative to lookat point
    const x =
      this.real.lookat.x +
      this.real.distance *
        Math.sin(this.real.polarAngle) *
        Math.cos(-this.real.azimuthAngle);
    const y =
      this.real.lookat.y + this.real.distance * Math.cos(this.real.polarAngle);
    const z =
      this.real.lookat.z +
      this.real.distance *
        Math.sin(this.real.polarAngle) *
        Math.sin(-this.real.azimuthAngle);

    // Update entity position
    this.entity.setLocalPosition(x, y, z);

    // Make camera look at lookat point
    this.entity.lookAt(
      this.real.lookat.x,
      this.real.lookat.y,
      this.real.lookat.z
    );

    // Update camera zoom
    camera.fov = (1 / this.real.zoom) * 50;
  }

  /**
   * Get the target position of the camera
   * @returns Vec3 representing the target camera position
   */
  getTargetPosition(): Vec3 {
    const x =
      this.target.lookat.x +
      this.target.distance *
        Math.sin(this.target.polarAngle) *
        Math.cos(-this.target.azimuthAngle);
    const y =
      this.target.lookat.y +
      this.target.distance * Math.cos(this.target.polarAngle);
    const z =
      this.target.lookat.z +
      this.target.distance *
        Math.sin(this.target.polarAngle) *
        Math.sin(-this.target.azimuthAngle);

    return new Vec3(x, y, z);
  }

  /**
   * Get the target lookat point
   * @returns Vec3 representing the target lookat point
   */
  getTargetLookAt(): Vec3 {
    return this.target.lookat.clone();
  }

  /**
   * Get the target zoom value
   * @returns number representing the target zoom
   */
  getTargetZoom(): number {
    return this.target.zoom;
  }

  getTargetAzimuthAngle(): number {
    return this.target.azimuthAngle;
  }

  getTargetPolarAngle(): number {
    return this.target.polarAngle;
  }

  /**
   * Set the target position of the camera
   * @param position The target position as Vec3
   */
  setTargetPosition(position: Vec3): void {
    // Calculate spherical coordinates from position and current lookat
    const relativePos = new Vec3();
    relativePos.sub2(position, this.target.lookat);

    // Calculate distance
    const distance = relativePos.length();

    // Calculate polar angle (vertical angle from Y-axis)
    const polarAngle = Math.acos(relativePos.y / distance);

    // Calculate azimuth angle (horizontal angle around Y-axis)
    const azimuthAngle = Math.atan2(-relativePos.z, relativePos.x);

    // Update target values
    this.target.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, distance)
    );
    this.target.polarAngle = polarAngle;
    this.target.azimuthAngle = azimuthAngle;

    this.clampTargetPolarAngle();
    this.clampTargetAzimuthAngle();
  }

  /**
   * Set the target lookat point while maintaining the current target position
   * @param lookAt The target lookat point as Vec3
   */
  setTargetLookAt(lookAt: Vec3): void {
    // Get the current target position
    const currentTargetPosition = this.getTargetPosition();

    // Update the lookat point
    this.target.lookat.copy(lookAt);

    // Calculate the new spherical coordinates from the current target position and new lookat
    const relativePos = new Vec3();
    relativePos.sub2(currentTargetPosition, this.target.lookat);

    // Calculate new distance
    const distance = relativePos.length();

    // Calculate new polar angle (vertical angle from Y-axis)
    const polarAngle = Math.acos(relativePos.y / distance);

    // Calculate new azimuth angle (horizontal angle around Y-axis)
    const azimuthAngle = Math.atan2(relativePos.z, relativePos.x);

    // Update target values to maintain the same position
    this.target.distance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, distance)
    );

    this.target.polarAngle = polarAngle;
    this.target.azimuthAngle = azimuthAngle;

    this.clampTargetPolarAngle();
    this.clampTargetAzimuthAngle();
  }

  /**
   * Set the target zoom value
   * @param zoom The target zoom value
   */
  setTargetZoom(zoom: number): void {
    if (this.controlsDisabled || this.zoomDisabled) {
      this.target.zoom = zoom;

      return;
    }

    this.target.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  getMinZoom(): number {
    return this.minZoom;
  }

  getMaxZoom(): number {
    return this.maxZoom;
  }

  setMinZoom(minZoom: number): void {
    this.minZoom = minZoom;
  }

  setMaxZoom(maxZoom: number): void {
    this.maxZoom = maxZoom;
  }

  /**
   * Set multiple target values at once
   * @param options Object containing position, lookAt, and/or zoom values
   */
  setTargetValues(options: {
    position?: Vec3;
    lookAt?: Vec3;
    zoom?: number;
  }): void {
    if (options.lookAt) {
      this.setTargetLookAt(options.lookAt);
    }
    if (options.position) {
      this.setTargetPosition(options.position);
    }
    if (options.zoom !== undefined) {
      this.setTargetZoom(options.zoom);
    }
  }

  setValues(options: { position?: Vec3; lookAt?: Vec3; zoom?: number }): void {
    this.setTargetValues(options);
    this.real.distance = this.target.distance;
    this.real.polarAngle = this.target.polarAngle;
    this.real.azimuthAngle = this.target.azimuthAngle;
    this.real.lookat.copy(this.target.lookat);
    this.real.zoom = this.target.zoom;

    this.updateCameraPosition();
    this.requestRender();
  }

  /**
   * Get the current position of the camera
   * @returns Vec3 representing the current camera position
   */
  getPosition(): Vec3 {
    return this.entity.getPosition().clone();
  }

  /**
   * Get the current lookat point
   * @returns Vec3 representing the current lookat point
   */
  getLookAt(): Vec3 {
    return this.real.lookat.clone();
  }

  /**
   * Get the current zoom value
   * @returns number representing the current zoom
   */
  getZoom(): number {
    return this.real.zoom;
  }

  setPosition(position: Vec3): void {
    this.setTargetPosition(position);

    this.real.distance = this.target.distance;
    this.real.polarAngle = this.target.polarAngle;
    this.real.azimuthAngle = this.target.azimuthAngle;
    this.real.lookat.copy(this.target.lookat);
    this.real.zoom = this.target.zoom;

    this.updateCameraPosition();
    this.requestRender();
  }

  setLookAt(lookAt: Vec3): void {
    this.setTargetLookAt(lookAt);
    this.real.lookat.copy(this.target.lookat);

    this.updateCameraPosition();
    this.requestRender();
  }

  setZoom(zoom: number): void {
    this.setTargetZoom(zoom);
    this.real.zoom = this.target.zoom;

    this.updateCameraPosition();
    this.requestRender();
  }

  /**
   * Disable camera controls (e.g., when gizmo is being used)
   */
  disableControls(): void {
    this.controlsDisabled = true;
    // Reset any active dragging/panning
    this.isMouseDown = false;
    this.isDragging = false;
    this.isPanning = false;
    // Disable auto-rotation when controls are disabled
    this.autoRotate = false;
  }

  /**
   * Enable camera controls
   */
  enableControls(): void {
    this.controlsDisabled = false;
    // Re-enable auto-rotation if user hasn't interacted
    if (!this.userHasInteracted) {
      this.autoRotate = true;
    }
  }

  disableZoom(): void {
    this.zoomDisabled = true;
  }

  enableZoom(): void {
    this.zoomDisabled = false;
  }

  /**
   * Check if controls are currently disabled
   */
  isControlsDisabled(): boolean {
    return this.controlsDisabled;
  }

  setIsLockedForOrbit(isLockedForOrbit: boolean): void {
    this.isLockedForOrbit = isLockedForOrbit;
  }

  /**
   * Rotate the camera around a specific lookat point
   * @param lookAt The point to rotate around
   * @param azimuthDelta The change in azimuth angle (horizontal rotation) in radians
   * @param polarDelta The change in polar angle (vertical rotation) in radians
   */
  rotateAroundLookAt(
    azimuthDelta: number = 0,
    polarDelta: number = 0,
    clamp: boolean = false
  ): void {
    // Apply rotation deltas
    this.target.azimuthAngle = this.baseAzimuthAngle + azimuthDelta;
    this.target.polarAngle = this.basePolarAngle + polarDelta;

    this.target.polarAngle = Math.max(0, this.target.polarAngle);
    this.target.polarAngle = Math.min(Math.PI, this.target.polarAngle);
  }

  resetRotation(): void {
    this.target.azimuthAngle = this.baseAzimuthAngle;
    this.target.polarAngle = this.basePolarAngle;
  }

  setCurrentAngleAsBaseAngle(): void {
    this.baseAzimuthAngle = this.target.azimuthAngle;
    this.basePolarAngle = this.target.polarAngle;
  }

  setBaseAzimuthAngle(azimuthAngle: number): void {
    this.baseAzimuthAngle = azimuthAngle;
  }

  setBasePolarAngle(polarAngle: number): void {
    this.basePolarAngle = polarAngle;
  }

  setMaxAzimuthAngle(maxAzimuthAngle: number): void {
    this.maxAzimuthAngle = maxAzimuthAngle;
    this.calculateDynamicSpeeds();
  }

  setMinAzimuthAngle(minAzimuthAngle: number): void {
    this.minAzimuthAngle = minAzimuthAngle;
    this.calculateDynamicSpeeds();
  }

  setMaxPolarAngle(maxPolarAngle: number): void {
    this.maxPolarAngle = maxPolarAngle;
    this.calculateDynamicSpeeds();
  }

  setMinPolarAngle(minPolarAngle: number): void {
    this.minPolarAngle = minPolarAngle;
    this.calculateDynamicSpeeds();
  }

  /**
   * Enable or disable auto-rotation
   * @param enabled Whether auto-rotation should be enabled
   */
  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  setHasUserInteracted(hasUserInteracted: boolean): void {
    this.userHasInteracted = hasUserInteracted;
  }

  /**
   * Set the auto-rotation speed in radians per second
   * @param speed The rotation speed in radians per second
   */
  setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = speed;
  }

  /**
   * Reset the user interaction state, allowing auto-rotation to resume
   */
  resetUserInteraction(): void {
    this.userHasInteracted = false;
    // Reset auto-rotation timers
    this.angleChangeTime = 0;
    // Reset directions to default
    this.autoRotateDirection = Math.random() > 0.5 ? 1 : -1;
    this.autoRotatePolarDirection = Math.random() > 0.5 ? 1 : -1;
  }

  /**
   * Check if auto-rotation is currently enabled
   * @returns true if auto-rotation is enabled
   */
  isAutoRotateEnabled(): boolean {
    return this.autoRotate;
  }

  /**
   * Check if the user has interacted with the camera
   * @returns true if the user has interacted
   */
  hasUserInteracted(): boolean {
    return this.userHasInteracted;
  }

  /**
   * Set the auto-rotation polar speed
   * @param speed The polar angle speed in radians per second
   */
  setAutoRotatePolarSpeed(speed: number): void {
    this.autoRotatePolarSpeed = speed;
  }

  /**
   * Set the angle change threshold for direction changes
   * @param threshold The time in seconds to wait before changing direction when hitting bounds
   */
  setAngleChangeThreshold(threshold: number): void {
    this.angleChangeThreshold = threshold;
  }

  /**
   * Set the auto-rotation duration (time to reach min/max angles)
   * @param duration The time in seconds to reach min/max angles
   */
  setAutoRotateDuration(duration: number): void {
    this.autoRotateDuration = duration;
    this.calculateDynamicSpeeds();
  }

  /**
   * Calculate dynamic auto-rotation speeds based on min/max angles
   */
  private calculateDynamicSpeeds(): void {
    // Calculate azimuth speed
    const minAzimuth =
      this.minAzimuthAngle === -Infinity
        ? this.autoRotationMinMaxAzimuthAngle
        : Math.min(this.minAzimuthAngle, this.autoRotationMinMaxAzimuthAngle);
    const maxAzimuth =
      this.maxAzimuthAngle === Infinity
        ? this.autoRotationMinMaxAzimuthAngle
        : Math.min(this.maxAzimuthAngle, this.autoRotationMinMaxAzimuthAngle);

    const azimuthRange = maxAzimuth + minAzimuth;

    // Calculate polar speed
    const minPolar = Math.min(
      this.minPolarAngle,
      this.autoRotationMinMaxPolarAngle
    );
    const maxPolar = Math.min(
      this.maxPolarAngle,
      this.autoRotationMinMaxPolarAngle
    );

    const polarRange = maxPolar + minPolar;

    // Calculate speeds to reach boundaries in autoRotateDuration seconds
    this.autoRotateSpeed = azimuthRange / this.autoRotateDuration;
    this.autoRotatePolarSpeed = polarRange / this.autoRotateDuration;
  }

  private clampTargetAzimuthAngle() {
    if (this.isLockedForOrbit) {
      if (this.minAzimuthAngle !== -Infinity) {
        this.target.azimuthAngle = Math.max(
          this.baseAzimuthAngle - this.minAzimuthAngle,
          this.target.azimuthAngle
        );
      }
      if (this.maxAzimuthAngle !== Infinity) {
        this.target.azimuthAngle = Math.min(
          this.baseAzimuthAngle + this.maxAzimuthAngle,
          this.target.azimuthAngle
        );
      }
    }
  }

  private clampTargetPolarAngle() {
    if (this.isLockedForOrbit) {
      this.target.polarAngle = Math.max(
        this.basePolarAngle - this.minPolarAngle,
        0,
        this.target.polarAngle
      );
      this.target.polarAngle = Math.min(
        this.basePolarAngle + this.maxPolarAngle,
        Math.PI,
        this.target.polarAngle
      );
    } else {
      this.target.polarAngle = Math.max(0, this.target.polarAngle);
      this.target.polarAngle = Math.min(Math.PI, this.target.polarAngle);
    }
  }

  update(dt: number) {
    // Handle keyboard input to stop auto-rotation
    if (this.keyboard && this.focused) {
      if (
        this.keyboard.isPressed(pc.KEY_LEFT) ||
        this.keyboard.isPressed(pc.KEY_RIGHT) ||
        this.keyboard.isPressed(pc.KEY_UP) ||
        this.keyboard.isPressed(pc.KEY_DOWN)
      ) {
        this.userHasInteracted = true;
        this.autoRotate = false;
      }
    }

    // Handle auto-rotation if enabled and user hasn't interacted
    if (this.autoRotate && !this.userHasInteracted && !this.controlsDisabled) {
      // Store previous angles for comparison
      const previousAzimuthAngle = this.target.azimuthAngle;
      const previousPolarAngle = this.target.polarAngle;

      // Apply auto-rotation to azimuth angle with direction
      const expectedAzimuth =
        this.target.azimuthAngle +
        this.autoRotateSpeed * this.autoRotateDirection * dt;
      const expectedPolar =
        this.target.polarAngle +
        this.autoRotatePolarSpeed * this.autoRotatePolarDirection * dt;

      let newAzimuthAngle = expectedAzimuth;
      let newPolarAngle = expectedPolar;

      // Ensure the angles stay within bounds
      // Clamp azimuth angle
      if (this.minAzimuthAngle !== -Infinity) {
        newAzimuthAngle = Math.max(
          this.baseAzimuthAngle - this.minAzimuthAngle,
          newAzimuthAngle
        );
      }

      newAzimuthAngle = Math.max(
        this.baseAzimuthAngle - this.autoRotationMinMaxAzimuthAngle,
        newAzimuthAngle
      );

      if (this.maxAzimuthAngle !== Infinity) {
        newAzimuthAngle = Math.min(
          this.baseAzimuthAngle + this.maxAzimuthAngle,
          newAzimuthAngle
        );
      }

      newAzimuthAngle = Math.min(
        this.baseAzimuthAngle + this.autoRotationMinMaxAzimuthAngle,
        newAzimuthAngle
      );

      // Clamp polar angle
      newPolarAngle = Math.max(
        this.basePolarAngle - this.minPolarAngle,
        0,
        newPolarAngle
      );
      newPolarAngle = Math.min(
        this.basePolarAngle + this.maxPolarAngle,
        Math.PI,
        newPolarAngle
      );

      newPolarAngle = Math.max(
        this.basePolarAngle - this.autoRotationMinMaxPolarAngle,
        0,
        newPolarAngle
      );
      newPolarAngle = Math.min(
        this.basePolarAngle + this.autoRotationMinMaxPolarAngle,
        Math.PI,
        newPolarAngle
      );

      // // If the actual change is significantly different from expected, it was clamped
      const azimuthWasClamped = expectedAzimuth !== newAzimuthAngle;
      const polarWasClamped = expectedPolar !== newPolarAngle;

      // If angles were clamped, start timer for direction change
      if (azimuthWasClamped || polarWasClamped) {
        this.angleChangeTime += dt;

        // Change direction after threshold time
        if (this.angleChangeTime >= this.angleChangeThreshold) {
          if (azimuthWasClamped) {
            this.autoRotateDirection = -this.autoRotateDirection;
          } else {
            this.autoRotateDirection = Math.random() > 0.5 ? 1 : -1;
          }

          if (polarWasClamped) {
            this.autoRotatePolarDirection = -this.autoRotatePolarDirection;
          } else {
            this.autoRotatePolarDirection = Math.random() > 0.5 ? 1 : -1;
          }

          this.calculateDynamicSpeeds();

          this.angleChangeTime = 0;
        }
      } else {
        // Reset timer if not hitting bounds
        this.angleChangeTime = 0;
        this.target.polarAngle = newPolarAngle;
        this.target.azimuthAngle = newAzimuthAngle;
      }
    }

    // Clamp target azimuth angle
    this.clampTargetAzimuthAngle();
    this.clampTargetPolarAngle();

    this.real.zoom += (this.target.zoom - this.real.zoom) * this.lerpFactor;

    // Lerp current angles to target angles
    this.real.polarAngle +=
      (this.target.polarAngle - this.real.polarAngle) * this.lerpFactor;

    const shortestPathTarget = this.getShortestPathAzimuthAngle(
      this.real.azimuthAngle,
      this.target.azimuthAngle
    );
    this.real.azimuthAngle +=
      (shortestPathTarget - this.real.azimuthAngle) * this.lerpFactor;

    this.real.distance +=
      (this.target.distance - this.real.distance) * this.lerpFactor;
    this.real.lookat.lerp(
      this.real.lookat,
      this.target.lookat,
      this.lerpFactor
    );

    // Update camera position based on new angles
    this.updateCameraPosition();

    // Check and emit camera events
    this.checkAndEmitCameraEvents();

    if (this.shouldRenderThisFrame()) {
      this.requestRender();
    }
  }
}
