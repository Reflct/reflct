import styles from "./Viewer.module.css";
import containerStyles from "../../css/Container.module.css";

import { Preload } from "@react-three/drei";
import React, { useRef } from "react";
import { CanvasContextProvider } from "../../context";
import { CanvasContextEventsType } from "../../context/CanvasContext";
import Background from "../Background";
import CameraLoader from "../CameraLoader";
import Canvas from "../Canvas";
import ErrorHandler from "../ErrorHandler";
import HitPoints from "../HitPoints";
import { HitPoint } from "../HitPoints/HitPoints";
import ObjectLoader from "../ObjectLoader";
import UI from "../UI";
import { UIChild } from "../UI/UI";

type Props = {
  id: string;
  apikey: string;
  isPreview?: boolean;
  sharedMemoryForWorkers?: boolean;
  className?: string;

  // renders
  hitPoint?: HitPoint;
  children?: UIChild;
} & CanvasContextEventsType;

const Viewer: React.FC<Props> = ({
  id,
  apikey,
  isPreview = false,
  sharedMemoryForWorkers = true,
  className,

  // events
  onLoadStart,
  onLoadProgressUpdate,
  onLoadComplete,
  onStateChangeStart,
  onStateChangeComplete,
  onError,

  // renders
  hitPoint,
  children,
}) => {
  if (!id || !apikey) {
    throw new Error("id and apikey are required");
  }

  const ref = useRef<HTMLDivElement>(null);

  return (
    <CanvasContextProvider
      value={{ id, apikey, isPreview, sharedMemoryForWorkers }}
      events={{
        onLoadStart,
        onLoadProgressUpdate,
        onLoadComplete,
        onStateChangeStart,
        onStateChangeComplete,
        onError,
      }}
    >
      <div
        className={`${containerStyles["reflct-wrapper"]} ${className || styles["wrapper"]}`}
        ref={ref}
      >
        <Background />
        <Canvas>
          <CameraLoader />
          <ObjectLoader />
          <Preload all />
          <HitPoints hitPoint={hitPoint} />
        </Canvas>
        <UI ui={children} />
        <ErrorHandler />
      </div>
    </CanvasContextProvider>
  );
};

export default Viewer;
