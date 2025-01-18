import React from "react";

import styles from "./LoadingIndicator.module.css";
import { useCanvasContext } from "../../context";

type Props = {
  className?: string;
  icon?: React.ReactNode;
};

const LoadingIndicator: React.FC<Props> = ({ className, icon }) => {
  const { isLoading, loadProgress } = useCanvasContext();

  if (!isLoading) return null;

  return (
    <div className={className || styles["reflct-loader"]}>
      <div className={styles["loader-container"]}>
        <div
          className={styles["loader-bar"]}
          style={{ width: `${loadProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default LoadingIndicator;
