//@ts-expect-error
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { GS3dData } from "@reflct/api";
import { useCanvasContext } from "../../context";
import { mapMetadataToRecord } from "../../utils/helper";

type Props = GS3dData;

const GS3dItem: React.FC<Props> = (props) => {
  const { src, position, rotation, scale } = props;

  const { scene, gl, camera } = useThree();
  const {
    setLoadProgress,
    setIsLoading,
    eventsRef,
    dataRef,
    sharedMemoryForWorkers,
    onNewScene,
  } = useCanvasContext();

  const viewerRef = useRef<any>(null);
  const transformMesh = useRef<any>(null);

  const [splatMesh, setSplatMesh] = useState(null);

  useEffect(() => {
    const canvas = document.querySelector("canvas");

    if (!canvas) {
      return;
    }

    if (viewerRef.current) {
      viewerRef.current.threeScene = scene;
      viewerRef.current.renderer = gl;
      viewerRef.current.camera = camera;
      viewerRef.current.rootElement = canvas;

      return;
    }

    viewerRef.current = new GaussianSplats3D.Viewer({
      selfDrivenMode: false,
      threeScene: scene,
      renderer: gl,
      camera: camera,
      rootElement: canvas,
      useBuiltInControls: false,
      // ignoreDevicePixelRatio: false,
      // gpuAcceleratedSort: true,
      // enableSIMDInSort: true,
      sharedMemoryForWorkers: sharedMemoryForWorkers,
      // integerBasedSort: false,
      // halfPrecisionCovariancesOnGPU: true,
      dynamicScene: true,
      // webXRMode: GaussianSplats3D.WebXRMode.None,
      renderMode: GaussianSplats3D.RenderMode.OnChange,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
      // antialiased: false,
      // focalAdjustment: 1.0,

      logLevel: GaussianSplats3D.LogLevel.Debug,
      sphericalHarmonicsDegree: 2,
      // splatRenderMode: 1,

      // enableOptionalEffects: false,
      // plyInMemoryCompressionLevel: 2,
      // freeIntermediateSplatData: false,
    });

    let progress = 0;

    // dataRef.current.transitionGroups.

    viewerRef.current
      .addSplatScene(src, {
        streamView: true,
        showLoadingUI: false,
        sphericalHarmonicsDegree: 2,
        onProgress: (percentComplete: number) => {
          if (progress < percentComplete) {
            progress = percentComplete;

            eventsRef.current.onLoadProgressUpdate?.(progress / 100);
            setLoadProgress(progress / 100);
          }
        },
      })
      .then(() => {
        transformMesh.current = viewerRef.current.splatMesh;
        setSplatMesh(transformMesh.current);

        const transitionGroup =
          dataRef.current.transitionGroups?.map((x) => ({
            title: x.title,
            description: x.description,
            metadata: mapMetadataToRecord(x.metadata ?? {}),
            views: x.transitions.map((y) => ({
              title: y.title,
              description: y.description,
              metadata: mapMetadataToRecord(y.metadata ?? {}),
              showTextDetails: y.showTextDetails,
            })),
          })) || [];

        eventsRef.current.onLoadComplete?.(
          transitionGroup,
          {
            title: dataRef.current.name ?? "",
            description: dataRef.current.description ?? "",
            metadata: mapMetadataToRecord(dataRef.current.metadata ?? {}),
            numberOfViews: dataRef.current.transitions?.length ?? 0,
            summaryImage: dataRef.current.summaryImage ?? null,
            linkedScenes: dataRef.current.linkedScenes ?? [],
          },
          dataRef.current.cameraInfo ?? null
        );

        onNewScene.push(() => {
          viewerRef.current.removeSplatScene(0);
        });

        setIsLoading(false);
      });
  }, [scene, gl, camera, src, position, rotation, scale, dataRef]);

  useFrame(() => {
    if (viewerRef.current) {
      viewerRef.current.update();
      viewerRef.current.render();
    }

    const children = viewerRef.current.splatMesh.children;
    children.forEach((child: any) => {
      const currentPosition = child.position as THREE.Vector3;
      currentPosition.set(position[0], position[1], position[2]);

      const currentQuaternion = child.quaternion as THREE.Quaternion;
      currentQuaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);

      const currentScale = child.scale as THREE.Vector3;
      currentScale.set(scale[0], scale[1], scale[2]);
    });
  }, 1);

  return null;
};

export default GS3dItem;
