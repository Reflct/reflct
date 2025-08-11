import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import * as pc from "playcanvas";
import React, { useEffect, useRef, useState } from "react";
import { useCanvasContext } from "../../context/CanvasContext";
import { HitPointsScript } from "../../scripts/hitpoints";
import { hexToRgbaFloat, lerp, mapMetadataToRecord } from "../../utils/helper";
import {
  CameraControlsScript,
  getCameraInstance,
} from "../../scripts/camera-controls";
import ErrorHandler from "../ErrorHandler/ErrorHandler";
import HitPoints, { HitPoint } from "../HitPoints/HitPoints";
import UI, { UIChild } from "../UI/UI";
import styles from "./Canvas.module.css";

type Props = {
  className?: string;
  hitPoint?: HitPoint;
  uiChild?: UIChild;
};

const Canvas: React.FC<Props> = ({ className, uiChild, hitPoint }) => {
  const {
    isLoading,
    sceneData,
    eventsRef,
    cameraRef,
    actionsRef,
    setIsLoading,
    setLoadProgress,
  } = useCanvasContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isTransitioningRef = useRef(false);
  const focusedRef = useRef(false);

  const [lastSceneBackground, setLastSceneBackground] = useState<string | null>(
    sceneData?.backgroundColor ?? null
  );

  useEffect(() => {
    if (!canvasRef.current || !sceneData) return;

    setLastSceneBackground(sceneData.backgroundColor);

    gsap.registerPlugin(CustomEase);

    // Create PlayCanvas application
    const canvas = canvasRef.current;
    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        alpha: true,
        premultipliedAlpha: false,
      },
    });

    const textureHandler = app.loader.getHandler("texture");

    if (textureHandler) (textureHandler as any).crossOrigin = "anonymous";

    // Set canvas size
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;

      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      app.setCanvasFillMode(pc.FILLMODE_NONE);
      app.setCanvasResolution(pc.RESOLUTION_AUTO);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Create camera
    const backgroundColor = hexToRgbaFloat(sceneData.backgroundColor);

    const camera = new pc.Entity(`camera-${sceneData.id}`);
    camera.addComponent("camera", {
      clearColor: new pc.Color(
        backgroundColor.r,
        backgroundColor.g,
        backgroundColor.b,
        backgroundColor.a
      ),
      clearColorBuffer: true,
      clearDepthBuffer: true,
    });

    // Add camera controls script
    camera.addComponent("script");
    camera.script?.create(CameraControlsScript);

    app.root.addChild(camera);

    const cameraControls = getCameraInstance(`camera-${sceneData.id}`);

    if (!cameraControls) {
      throw new Error("Camera controls not found");
    }

    const firstTransition =
      sceneData.data.transitionGroups[0].transitions[0].item ||
      sceneData.data.camera;

    cameraControls.setValues({
      position: new pc.Vec3(
        firstTransition.position[0],
        firstTransition.position[1],
        firstTransition.position[2]
      ),
      lookAt: new pc.Vec3(
        firstTransition.lookAt[0],
        firstTransition.lookAt[1],
        firstTransition.lookAt[2]
      ),
      zoom: firstTransition.zoom,
    });
    cameraControls.setMinPolarAngle(firstTransition.minPolarAngle ?? Math.PI);
    cameraControls.setMaxPolarAngle(firstTransition.maxPolarAngle ?? Math.PI);
    cameraControls.setMinAzimuthAngle(
      firstTransition.minAzimuthAngle ?? -Infinity
    );
    cameraControls.setMaxAzimuthAngle(
      firstTransition.maxAzimuthAngle ?? Infinity
    );
    cameraControls.setIsLockedForOrbit(true);

    cameraControls?.setCurrentAngleAsBaseAngle();

    cameraRef.current = {
      getPosition: (): [number, number, number] => {
        const position = cameraControls?.getPosition();

        return [position.x, position.y, position.z];
      },
      getZoom: (): number => {
        return cameraControls?.getZoom() || 0;
      },
      getLookat: (): [number, number, number] => {
        const lookat = cameraControls?.getLookAt();

        return [lookat.x, lookat.y, lookat.z];
      },
      setPosition: (position: [number, number, number]): void => {
        cameraControls.setIsLockedForOrbit(false);
        cameraControls?.setPosition(
          new pc.Vec3(position[0], position[1], position[2])
        );

        cameraControls?.setCurrentAngleAsBaseAngle();
        cameraControls.setIsLockedForOrbit(true);
      },
      setZoom: (zoom: number): void => {
        cameraControls?.setZoom(zoom);
      },
      setLookat: (lookat: [number, number, number]): void => {
        cameraControls.setIsLockedForOrbit(false);
        cameraControls?.setLookAt(new pc.Vec3(lookat[0], lookat[1], lookat[2]));

        cameraControls?.setCurrentAngleAsBaseAngle();
        cameraControls.setIsLockedForOrbit(true);
      },
    };

    let timeline: gsap.core.Timeline | null = null;

    actionsRef.current.setState = (state: number) => {
      if (timeline) {
        timeline.kill();
      }

      const views = actionsRef.current.getViews();

      const targetState = (state + views.length) % views.length;

      const targetView = views[targetState];

      const currentTransitionGroup = sceneData.data.transitionGroups.find(
        (group) => group.transitions.find((x) => x.id === targetView.id)
      );

      const currentPosition = cameraControls.getPosition();
      const currentLookat = cameraControls.getLookAt();
      const currentZoom = cameraControls.getZoom();

      const reference = {
        progress: 0,
      };

      const currentValues = {
        positionX: currentPosition.x,
        positionY: currentPosition.y,
        positionZ: currentPosition.z,
        lookatX: currentLookat.x,
        lookatY: currentLookat.y,
        lookatZ: currentLookat.z,
        zoom: currentZoom,
      };
      const targetValues = {
        positionX: targetView.item.position[0],
        positionY: targetView.item.position[1],
        positionZ: targetView.item.position[2],
        lookatX: targetView.item.lookAt[0],
        lookatY: targetView.item.lookAt[1],
        lookatZ: targetView.item.lookAt[2],
        zoom: targetView.item.zoom,
      };

      const position = new pc.Vec3();
      const lookat = new pc.Vec3();
      let zoom = 0;

      timeline = gsap
        .timeline({
          onStart: () => {
            isTransitioningRef.current = true;
            cameraControls.disableControls();

            cameraControls.setIsLockedForOrbit(false);

            actionsRef.current.setCurrentState(targetState);

            eventsRef.current.onStateChangeStart?.(
              {
                title: targetView.title,
                description: targetView.description,
                metadata: mapMetadataToRecord(targetView.metadata ?? {}),
                showTextDetails: targetView.showTextDetails,
              },
              {
                title: currentTransitionGroup?.title ?? "",
                description: currentTransitionGroup?.description ?? "",
                metadata: mapMetadataToRecord(
                  currentTransitionGroup?.metadata ?? {}
                ),
                views:
                  currentTransitionGroup?.transitions.map((view) => ({
                    title: view.title,
                    description: view.description,
                    metadata: mapMetadataToRecord(view.metadata ?? {}),
                    showTextDetails: view.showTextDetails,
                  })) || [],
              },
              {
                title: sceneData.name ?? "",
                description: sceneData.description ?? "",
                metadata: mapMetadataToRecord(sceneData.metadata ?? {}),
                numberOfViews: sceneData.data.transitionGroups.flatMap(
                  (group) => group.transitions.length
                ).length,
                summaryImage: sceneData.summaryImage ?? null,
                linkedScenes: sceneData.linkedScenes ?? [],
              },
              cameraRef.current
            );
          },
          onUpdate: () => {
            const progress = reference.progress;

            position.set(
              lerp(currentValues.positionX, targetValues.positionX, progress),
              lerp(currentValues.positionY, targetValues.positionY, progress),
              lerp(currentValues.positionZ, targetValues.positionZ, progress)
            );
            lookat.set(
              lerp(currentValues.lookatX, targetValues.lookatX, progress),
              lerp(currentValues.lookatY, targetValues.lookatY, progress),
              lerp(currentValues.lookatZ, targetValues.lookatZ, progress)
            );
            zoom = lerp(currentValues.zoom, targetValues.zoom, progress);

            cameraControls?.setValues({
              position,
              lookAt: lookat,
              zoom,
            });
          },
          onComplete: () => {
            isTransitioningRef.current = false;

            cameraControls.setMinPolarAngle(targetView.item.minPolarAngle ?? 0);
            cameraControls.setMaxPolarAngle(
              targetView.item.maxPolarAngle ?? Math.PI
            );
            cameraControls.setMinAzimuthAngle(
              targetView.item.minAzimuthAngle ?? -Infinity
            );
            cameraControls.setMaxAzimuthAngle(
              targetView.item.maxAzimuthAngle ?? Infinity
            );
            cameraControls.setIsLockedForOrbit(true);

            cameraControls?.setCurrentAngleAsBaseAngle();
            cameraControls.enableControls();

            eventsRef.current.onStateChangeComplete?.(
              {
                title: targetView.title,
                description: targetView.description,
                metadata: mapMetadataToRecord(targetView.metadata ?? {}),
                showTextDetails: targetView.showTextDetails,
              },
              {
                title: currentTransitionGroup?.title ?? "",
                description: currentTransitionGroup?.description ?? "",
                metadata: mapMetadataToRecord(
                  currentTransitionGroup?.metadata ?? {}
                ),
                views:
                  currentTransitionGroup?.transitions.map((view) => ({
                    title: view.title,
                    description: view.description,
                    metadata: mapMetadataToRecord(view.metadata ?? {}),
                    showTextDetails: view.showTextDetails,
                  })) || [],
              },
              {
                title: sceneData.name ?? "",
                description: sceneData.description ?? "",
                metadata: mapMetadataToRecord(sceneData.metadata ?? {}),
                numberOfViews: sceneData.data.transitionGroups.flatMap(
                  (group) => group.transitions.length
                ).length,
                summaryImage: sceneData.summaryImage ?? null,
                linkedScenes: sceneData.linkedScenes ?? [],
              },
              cameraRef.current
            );
          },
        })
        .to(reference, {
          progress: 1,
          duration:
            targetView.duration /
            actionsRef.current.getTransitionSpeedMultiplier(),
          ease: CustomEase.create(
            "custom",
            targetView.easing?.replace(/\s/g, "")
          ),
        });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!focusedRef.current) return;

      if (event.key === "ArrowRight") {
        actionsRef.current.setState(actionsRef.current.getCurrentState() + 1);
      } else if (event.key === "ArrowLeft") {
        actionsRef.current.setState(actionsRef.current.getCurrentState() - 1);
      }
    };

    const handleWindowClick = (event: MouseEvent) => {
      try {
        if (canvas.contains(event.target as Node)) {
          focusedRef.current = true;
        } else {
          focusedRef.current = false;
        }
      } catch {}
    };

    window.addEventListener("click", handleWindowClick);
    window.addEventListener("keydown", handleKeyDown);

    // Create hit points entity
    const hitPointsEntity = new pc.Entity(`hitpoints-${sceneData.id}`);
    hitPointsEntity.addComponent("script");
    hitPointsEntity.script?.create(HitPointsScript);

    app.root.addChild(hitPointsEntity);

    sceneData.data.items.forEach((item) => {
      // Create new asset for new entity
      const asset = new pc.Asset(
        item.id,
        "gsplat",
        {
          url: item.src,
        },
        {
          filename: item.src,
        }
      );

      // Add asset to registry
      app.assets.add(asset);

      // Load asset
      app.assets.loadFromUrl(
        item.src,
        "gsplat",
        (err: string | null, loadedAsset: pc.Asset | undefined) => {
          if (err || !loadedAsset) {
            throw new Error(`Error loading asset: ${err}`);
          }

          // Create entity
          const newEntity = new pc.Entity(`gs3d_${item.id}`);

          // Add model component
          newEntity.addComponent("gsplat", {
            type: "asset",
            asset: loadedAsset,
          });

          // Set transform
          newEntity.setLocalPosition(
            item.position[0],
            item.position[1],
            item.position[2]
          );

          // Convert quaternion to euler angles
          const quat = new pc.Quat(
            item.rotation[0],
            item.rotation[1],
            item.rotation[2],
            item.rotation[3]
          );
          const euler = new pc.Vec3();
          quat.getEulerAngles(euler);
          newEntity.setLocalEulerAngles(euler.x, euler.y, euler.z);

          newEntity.setLocalScale(item.scale[0], item.scale[1], item.scale[2]);
          // Add to scene
          app.root.addChild(newEntity);

          // Update loading progress
          eventsRef.current.onLoadProgressUpdate?.(1);
          eventsRef.current.onLoadComplete?.(
            sceneData.data.transitionGroups.map((group) => ({
              title: group.title,
              description: group.description,
              metadata: mapMetadataToRecord(group.metadata),
              views: group.transitions.map((transition) => ({
                title: transition.title,
                description: transition.description,
                metadata: mapMetadataToRecord(transition.metadata),
              })),
            })),
            {
              numberOfViews: sceneData.data.transitionGroups.flatMap(
                (group) => group.transitions.length
              ).length,
              summaryImage: sceneData.summaryImage || null,
              linkedScenes: sceneData.linkedScenes,
            },
            cameraRef.current
          );

          setLoadProgress(1);
          setIsLoading(false);
        }
      );

      // Track loading progress
      asset.on("progress", (loaded: number, total: number) => {
        eventsRef.current.onLoadProgressUpdate?.(loaded / total);
        setLoadProgress(loaded / total);
      });
    });

    // Start the application
    app.start();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("click", handleWindowClick);

      camera.remove();
      app.destroy();

      cameraRef.current = null;
    };
  }, [sceneData]);

  return (
    <div
      className={`${styles["reflct-wrapper"]} ${className || ""}`}
      ref={containerRef}
    >
      <canvas
        className={className || styles["reflct-canvas"]}
        ref={canvasRef}
      />

      <div
        className={styles["reflct-loading-screen"]}
        style={{
          backgroundColor: isLoading
            ? lastSceneBackground || "transparent"
            : "transparent",
        }}
      />

      <HitPoints hitPoint={hitPoint} />
      <UI ui={uiChild} />
      <ErrorHandler />
    </div>
  );
};

export default Canvas;
