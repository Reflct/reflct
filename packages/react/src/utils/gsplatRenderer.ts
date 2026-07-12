import {
  ADDRESS_CLAMP_TO_EDGE,
  createGraphicsDevice,
  createShaderFromCode,
  DEVICETYPE_WEBGL2,
  drawQuadWithShader,
  FILTER_NEAREST,
  GSPLATDATA_LARGE,
  PIXELFORMAT_DEPTH,
  PIXELFORMAT_RGBA16F,
  RenderTarget,
  SEMANTIC_POSITION,
  Texture,
  TONEMAP_LINEAR,
  type AppBase,
  type Entity,
  type GraphicsDevice,
  type Shader,
} from "playcanvas";

const GRAPHICS_DEVICE_OPTIONS = {
  alpha: true,
  premultipliedAlpha: false,
} as const;

const BLIT_VS = /* glsl */ `
attribute vec2 vertex_position;
void main(void) {
  gl_Position = vec4(vertex_position, 0.0, 1.0);
}
`;

const BLIT_FS = /* glsl */ `
uniform sampler2D srcTexture;
void main(void) {
  ivec2 texel = ivec2(gl_FragCoord.xy);
  gl_FragColor = texelFetch(srcTexture, texel, 0);
}
`;

let playCanvasLifecycle = Promise.resolve();

export function runPlayCanvasLifecycle<T>(
  task: () => Promise<T> | T,
): Promise<T> {
  const next = playCanvasLifecycle.then(task);
  playCanvasLifecycle = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function createPreferredGraphicsDevice(
  canvas: HTMLCanvasElement,
): Promise<GraphicsDevice> {
  const device = await createGraphicsDevice(canvas, {
    ...GRAPHICS_DEVICE_OPTIONS,
    deviceTypes: [DEVICETYPE_WEBGL2],
  });

  console.log(
    `[gsplat] Graphics device: ${device.isWebGPU ? "WebGPU" : "WebGL"}`,
  );

  return device;
}

export function configureGsplatRenderer(app: AppBase): void {
  app.graphicsDevice.maxPixelRatio = 1;
  app.scene.gsplat.dataFormat = GSPLATDATA_LARGE;
  app.scene.gsplat.radialSorting = true;
  app.scene.gsplat.minContribution = 0;
  app.scene.gsplat.useFog = false;
  // Keep SH colors in sync with the camera (default 10° leaves stale/wrong colors).
  app.scene.gsplat.colorUpdateAngle = 0;
}

export function applyGsplatAntiAlias(app: AppBase, enabled: boolean): void {
  app.scene.gsplat.antiAlias = enabled;
}

/**
 * SuperSplat-style path: camera renders to RGBA16F, linear tonemap, blit to canvas.
 */
export class HdrLinearCameraPath {
  private app: AppBase;
  private camera: Entity;
  private hdrTarget: RenderTarget | null = null;
  private blitShader: Shader | null = null;
  private readonly onPostRender: () => void;

  constructor(app: AppBase, camera: Entity) {
    this.app = app;
    this.camera = camera;

    if (camera.camera) {
      camera.camera.toneMapping = TONEMAP_LINEAR;
    }
    app.scene.exposure = 1;

    this.blitShader = createShaderFromCode(
      app.graphicsDevice,
      BLIT_VS,
      BLIT_FS,
      "viewerHdrFinalBlit",
      { vertex_position: SEMANTIC_POSITION },
    );

    this.onPostRender = () => this.blitToCanvas();
    app.on("postrender", this.onPostRender);
    this.resize();
  }

  resize(): void {
    const device = this.app.graphicsDevice;
    const width = Math.max(1, device.width);
    const height = Math.max(1, device.height);

    if (
      this.hdrTarget &&
      this.hdrTarget.width === width &&
      this.hdrTarget.height === height
    ) {
      if (this.camera.camera) {
        this.camera.camera.renderTarget = this.hdrTarget;
      }
      return;
    }

    const colorBuffer = new Texture(device, {
      name: "viewerCameraColor",
      width,
      height,
      format: PIXELFORMAT_RGBA16F,
      mipmaps: false,
      minFilter: FILTER_NEAREST,
      magFilter: FILTER_NEAREST,
      addressU: ADDRESS_CLAMP_TO_EDGE,
      addressV: ADDRESS_CLAMP_TO_EDGE,
    });
    const depthBuffer = new Texture(device, {
      name: "viewerCameraDepth",
      width,
      height,
      format: PIXELFORMAT_DEPTH,
      mipmaps: false,
      minFilter: FILTER_NEAREST,
      magFilter: FILTER_NEAREST,
      addressU: ADDRESS_CLAMP_TO_EDGE,
      addressV: ADDRESS_CLAMP_TO_EDGE,
    });

    const nextTarget = new RenderTarget({
      name: "viewerHdrMain",
      colorBuffer,
      depthBuffer,
      flipY: false,
    });

    // Swap before destroying so the camera never briefly has no target (blank frame).
    const prevTarget = this.hdrTarget;
    this.hdrTarget = nextTarget;
    if (this.camera.camera) {
      this.camera.camera.renderTarget = nextTarget;
    }

    if (prevTarget) {
      const prevColor = prevTarget.colorBuffer;
      const prevDepth = prevTarget.depthBuffer;
      prevTarget.destroy();
      prevColor?.destroy();
      prevDepth?.destroy();
    }
  }

  destroy(): void {
    this.app.off("postrender", this.onPostRender);
    this.destroyTarget();
    this.blitShader?.destroy();
    this.blitShader = null;
  }

  private blitToCanvas(): void {
    if (!this.hdrTarget?.colorBuffer || !this.blitShader) return;
    const device = this.app.graphicsDevice;
    device.scope.resolve("srcTexture").setValue(this.hdrTarget.colorBuffer);
    drawQuadWithShader(device, null, this.blitShader);
  }

  private destroyTarget(): void {
    if (this.camera.camera) {
      this.camera.camera.renderTarget = undefined as unknown as RenderTarget;
    }
    if (this.hdrTarget) {
      const color = this.hdrTarget.colorBuffer;
      const depth = this.hdrTarget.depthBuffer;
      this.hdrTarget.destroy();
      this.hdrTarget = null;
      color?.destroy();
      depth?.destroy();
    }
  }
}
