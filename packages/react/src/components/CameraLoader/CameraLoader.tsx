import React from "react";
import { useCanvasContext } from "../../context";
import PerspectiveCameraItem from "../Camera/PerspectiveCameraItem";

const CameraLoader = () => {
  const { camera } = useCanvasContext();

  if (!camera) {
    return null;
  }

  return <PerspectiveCameraItem {...camera} />;
};

export default CameraLoader;
