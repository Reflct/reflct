import { Canvas as CanvasFiber } from "@react-three/fiber";
import React from "react";

import { useCanvasContext } from "../../context";
import styles from "./Canvas.module.css";

type Props = {
  className?: string;
  children: React.ReactNode;
};

const Canvas: React.FC<Props> = ({ className, children }) => {
  const { setDom } = useCanvasContext();

  return (
    <CanvasFiber
      className={className || styles["reflct-canvas"]}
      ref={(element) => {
        setDom(element);
      }}
    >
      {children}
    </CanvasFiber>
  );
};

export default Canvas;
