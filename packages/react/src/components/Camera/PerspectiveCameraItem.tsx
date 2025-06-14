import { CameraControls, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { PerspectiveCameraData } from "@reflct/api";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCanvasContext } from "../../context";
import { mapMetadataToRecord } from "../../utils/helper";

type Props = PerspectiveCameraData;

const PerspectiveCameraItem: React.FC<Props> = (props) => {
  const { id, fov, aspect, near, far, position, lookAt, zoom } = props;

  const {
    automode,
    state = 0,
    dom,
    isLoading,
    transitions,
    transitionGroups,
    eventsRef,
    dataRef,
    transitionSpeedMultiplier,
    automodeTransitionSpeedMultiplier,
  } = useCanvasContext();
  const { invalidate, camera, gl } = useThree();

  const ref = useRef<THREE.PerspectiveCamera>(null);
  const controlRef = useRef<CameraControls>(null);
  const loadedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const vectorState = useRef({
    positionVector: new THREE.Vector3(position[0], position[1], position[2]),
    lookAtVector: new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]),
    speedMultiplier: 1,
  });

  useEffect(() => {
    vectorState.current.speedMultiplier = automode
      ? automodeTransitionSpeedMultiplier
      : transitionSpeedMultiplier;
  }, [automode, transitionSpeedMultiplier, automodeTransitionSpeedMultiplier]);

  useEffect(() => {
    const position = new THREE.Vector3();
    const lookat = new THREE.Vector3();

    controlRef.current?.getPosition(position);
    controlRef.current?.getTarget(lookat);

    dataRef.current.cameraInfo = {
      getPosition: () => {
        controlRef.current?.getPosition(position);

        return [position.x, position.y, position.z];
      },
      getLookat: () => {
        controlRef.current?.getTarget(lookat);

        return [lookat.x, lookat.y, lookat.z];
      },
      getZoom: () => {
        return ref.current?.zoom ?? 1;
      },
      setPosition: (position: [number, number, number]) => {
        if (isTransitioningRef.current) {
          return;
        }

        controlRef.current?.setPosition(
          position[0],
          position[1],
          position[2],
          false
        );
      },
      setLookat: (lookat: [number, number, number]) => {
        if (isTransitioningRef.current) {
          return;
        }

        controlRef.current?.setTarget(lookat[0], lookat[1], lookat[2], false);
      },
      setZoom: (zoom: number) => {
        if (isTransitioningRef.current) {
          return;
        }

        controlRef.current?.zoomTo(zoom, false);
      },
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(CustomEase);

    const camera = ref.current;
    const control = controlRef.current;

    const currentTransition = transitions.at(state % transitions.length);

    if (!currentTransition) {
      return;
    }

    const targetItem = currentTransition.item;

    if (
      camera &&
      control &&
      targetItem.id === id &&
      targetItem.type === "perspectiveCamera"
    ) {
      gsap.killTweensOf([camera.position, camera.rotation, camera]);

      const reference = {
        progress: 0,
      };

      const originalPosition = control.getPosition(
        vectorState.current.positionVector
      );
      const targetPosition = new THREE.Vector3(
        targetItem.position[0],
        targetItem.position[1],
        targetItem.position[2]
      );
      const originalLootAt = control.getTarget(
        vectorState.current.lookAtVector
      );
      const targetLootAt = new THREE.Vector3(
        targetItem.lookAt[0],
        targetItem.lookAt[1],
        targetItem.lookAt[2]
      );

      const originalZoom = camera.zoom;
      const targetZoom = targetItem.zoom;

      if (!loadedRef.current) {
        control.setLookAt(
          targetPosition.x,
          targetPosition.y,
          targetPosition.z,
          targetLootAt.x,
          targetLootAt.y,
          targetLootAt.z,
          false
        );
        control.zoomTo(targetZoom, false);

        control.disconnect();
        control.normalizeRotations();

        control.maxAzimuthAngle =
          targetItem.maxAzimuthAngle === null
            ? Number.POSITIVE_INFINITY
            : control.azimuthAngle + targetItem.maxAzimuthAngle;
        control.minAzimuthAngle =
          targetItem.minAzimuthAngle === null
            ? Number.NEGATIVE_INFINITY
            : control.azimuthAngle - targetItem.minAzimuthAngle;
        control.maxPolarAngle =
          targetItem.maxPolarAngle === null
            ? Number.POSITIVE_INFINITY
            : control.polarAngle + targetItem.maxPolarAngle;
        control.minPolarAngle =
          targetItem.minPolarAngle === null
            ? Number.NEGATIVE_INFINITY
            : control.polarAngle - targetItem.minPolarAngle;

        control.saveState();

        invalidate();
        return;
      }

      const timeline = gsap
        .timeline({
          onStart: () => {
            const currentTransitionGroup =
              dataRef.current.transitionGroups?.find((group) =>
                group.transitions.find((x) => x.id === currentTransition.id)
              );

            isTransitioningRef.current = true;

            eventsRef.current.onStateChangeStart?.(
              {
                title: currentTransition.title,
                description: currentTransition.description,
                metadata: mapMetadataToRecord(currentTransition.metadata ?? {}),
                showTextDetails: currentTransition.showTextDetails,
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
                title: dataRef.current.name ?? "",
                description: dataRef.current.description ?? "",
                metadata: mapMetadataToRecord(dataRef.current.metadata ?? {}),
                numberOfViews: transitions.length,
                summaryImage: dataRef.current.summaryImage ?? null,
                linkedScenes: dataRef.current.linkedScenes ?? [],
              },
              dataRef.current.cameraInfo ?? null
            );
          },
          onUpdate: () => {
            const currentPosition = originalPosition
              .clone()
              .lerp(targetPosition, reference.progress);
            const currentLookAt = originalLootAt
              .clone()
              .lerp(targetLootAt, reference.progress);

            const currentZoom = THREE.MathUtils.lerp(
              originalZoom,
              targetZoom,
              reference.progress
            );

            control.setLookAt(
              currentPosition.x,
              currentPosition.y,
              currentPosition.z,
              currentLookAt.x,
              currentLookAt.y,
              currentLookAt.z,
              false
            );

            control.zoomTo(currentZoom, false);

            control.disconnect();
            control.normalizeRotations();

            control.maxAzimuthAngle =
              targetItem.maxAzimuthAngle === null
                ? Number.POSITIVE_INFINITY
                : control.azimuthAngle + targetItem.maxAzimuthAngle;
            control.minAzimuthAngle =
              targetItem.minAzimuthAngle === null
                ? Number.NEGATIVE_INFINITY
                : control.azimuthAngle - targetItem.minAzimuthAngle;
            control.maxPolarAngle =
              targetItem.maxPolarAngle === null
                ? Number.POSITIVE_INFINITY
                : control.polarAngle + targetItem.maxPolarAngle;
            control.minPolarAngle =
              targetItem.minPolarAngle === null
                ? Number.NEGATIVE_INFINITY
                : control.polarAngle - targetItem.minPolarAngle;

            control.saveState();

            invalidate();
          },
          onComplete: () => {
            if (dom) {
              control.connect(dom);
            }

            isTransitioningRef.current = false;

            const currentTransitionGroup =
              dataRef.current.transitionGroups?.find((group) =>
                group.transitions.find((x) => x.id === currentTransition.id)
              );

            eventsRef.current.onStateChangeComplete?.(
              {
                title: currentTransition.title,
                description: currentTransition.description,
                metadata: mapMetadataToRecord(currentTransition.metadata ?? {}),
                showTextDetails: currentTransition.showTextDetails,
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
                title: dataRef.current.name ?? "",
                description: dataRef.current.description ?? "",
                metadata: mapMetadataToRecord(dataRef.current.metadata ?? {}),
                numberOfViews: transitions.length,
                summaryImage: dataRef.current.summaryImage ?? null,
                linkedScenes: dataRef.current.linkedScenes ?? [],
              },
              dataRef.current.cameraInfo ?? null
            );
          },
        })
        .to(
          reference,
          {
            progress: 1,
            duration:
              currentTransition.duration / vectorState.current.speedMultiplier,
            ease: CustomEase.create(
              "custom",
              currentTransition.easing?.replace(/\s/g, "")
            ),
          },
          0
        )
        .to(
          camera,
          {
            fov: targetItem.fov,
            // aspect: targetItem.aspect,
            near: targetItem.near,
            far: targetItem.far,
            // zoom: targetItem.zoom,
            duration: currentTransition.duration,
            ease: CustomEase.create(
              "custom",
              currentTransition.easing?.replace(/\s/g, "")
            ),
          },
          0
        );

      return () => {
        timeline.kill();
      };
    }
  }, [id, invalidate, state, transitions, dataRef]);

  useEffect(() => {
    const control = controlRef.current;

    if (control) {
      control.mouseButtons.right = 0;
      control.mouseButtons.wheel = 0;
      control.mouseButtons.middle = 0;

      control.touches.two = 0;
      control.touches.three = 0;
    }
  }, [camera, gl]);

  useEffect(() => {
    if (!isLoading && !loadedRef.current) {
      const control = controlRef.current;
      const currentTransition = transitions.at(state % transitions.length);

      if (!currentTransition) {
        return;
      }

      if (!control) {
        return;
      }

      (async () => {
        await control?.setLookAt(
          position[0],
          position[1],
          position[2],
          lookAt[0],
          lookAt[1],
          lookAt[2],
          false
        );
        await control.zoomTo(zoom, false);

        control.disconnect();
        control.normalizeRotations();

        control.maxAzimuthAngle =
          currentTransition.item.maxAzimuthAngle === null
            ? Number.POSITIVE_INFINITY
            : control.azimuthAngle + currentTransition.item.maxAzimuthAngle;
        control.minAzimuthAngle =
          currentTransition.item.minAzimuthAngle === null
            ? Number.NEGATIVE_INFINITY
            : control.azimuthAngle - currentTransition.item.minAzimuthAngle;
        control.maxPolarAngle =
          currentTransition.item.maxPolarAngle === null
            ? Number.POSITIVE_INFINITY
            : control.polarAngle + currentTransition.item.maxPolarAngle;
        control.minPolarAngle =
          currentTransition.item.minPolarAngle === null
            ? Number.NEGATIVE_INFINITY
            : control.polarAngle - currentTransition.item.minPolarAngle;

        control.saveState();

        if (dom) {
          control.connect(dom);
        }

        loadedRef.current = true;
      })();
    }
  }, [isLoading]);

  return (
    <>
      <PerspectiveCamera
        ref={ref}
        fov={fov}
        near={near}
        far={far}
        position={position as THREE.Vector3Tuple}
        zoom={zoom}
        makeDefault
      />
      <CameraControls ref={controlRef} />
    </>
  );
};

export default PerspectiveCameraItem;
