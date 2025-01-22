import { Preload } from "@react-three/drei";
import React, { useRef } from "react";
import { CanvasContextProvider } from "../../context";
import { CanvasContextEventsType } from "../../context/CanvasContext";
import CameraLoader from "../CameraLoader";
import Canvas from "../Canvas";
import ErrorHandler from "../ErrorHandler";
import ObjectLoader from "../ObjectLoader";
import UI from "../UI";
import { UIChild } from "../UI/UI";
import styles from "./Viewer.module.css";
import Background from "../Background";

type Props = {
  id: string;
  apikey: string;
  isPreview?: boolean;
  sharedMemoryForWorkers?: boolean;
  className?: string;
  sceneRevealMode?: "instant" | "gradual";

  // renders
  children?: UIChild;
} & CanvasContextEventsType;

const Viewer: React.FC<Props> = ({
  id,
  apikey,
  isPreview = false,
  sharedMemoryForWorkers = true,
  sceneRevealMode = "gradual",
  className,

  // events
  onLoadStart,
  onLoadProgressUpdate,
  onLoadComplete,
  onStateChangeStart,
  onStateChangeComplete,
  onError,

  // renders
  children,
}) => {
  if (!id || !apikey) {
    throw new Error("id and apikey are required");
  }

  const ref = useRef<HTMLDivElement>(null);

  return (
    <CanvasContextProvider
      value={{ id, apikey, isPreview, sharedMemoryForWorkers, sceneRevealMode }}
      events={{
        onLoadStart,
        onLoadProgressUpdate,
        onLoadComplete,
        onStateChangeStart,
        onStateChangeComplete,
        onError,
      }}
    >
      <div className={className || `${styles["mantel-wrapper"]}`} ref={ref}>
        <Background />
        <Canvas>
          <CameraLoader />
          <ObjectLoader />
          <Preload all />
        </Canvas>
        <UI ui={children} />
        <ErrorHandler />
      </div>
    </CanvasContextProvider>
  );
};

export default Viewer;
