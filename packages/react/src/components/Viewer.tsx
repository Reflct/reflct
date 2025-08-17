import React from "react";
import {
  CanvasContextProvider,
  CanvasContextEventsType,
} from "../context/CanvasContext";
import Canvas from "./Canvas/Canvas";
import { HitPoint } from "./HitPoints/HitPoints";
import { UIChild } from "./UI/UI";

export type ViewerProps = {
  id: string;
  apikey: string;
  isPreview?: boolean;
  sharedMemoryForWorkers?: boolean;
  className?: string;

  // camera
  transitionSpeedMultiplier?: number;
  automodeTransitionSpeedMultiplier?: number;

  // renders
  hitPoint?: HitPoint;
  children?: UIChild;
} & CanvasContextEventsType;

const Viewer: React.FC<ViewerProps> = ({
  id,
  apikey,
  isPreview = false,
  className = "",

  transitionSpeedMultiplier = 1,
  automodeTransitionSpeedMultiplier = 0.5,

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

  return (
    <CanvasContextProvider
      value={{
        id,
        apikey,
        isPreview,
        transitionSpeedMultiplier,
        automodeTransitionSpeedMultiplier,
      }}
      events={{
        onLoadStart,
        onLoadProgressUpdate,
        onLoadComplete,
        onStateChangeStart,
        onStateChangeComplete,
        onError,
      }}
    >
      <Canvas className={className} uiChild={children} hitPoint={hitPoint} />
    </CanvasContextProvider>
  );
};

export default Viewer;
