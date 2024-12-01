import React from "react";

import styles from "./LoadingIndicator.module.css";
import { useCanvasContext } from "../../context";

type Props = {
  className?: string;
  icon?: React.ReactNode;
};

const LoadingIndicator: React.FC<Props> = ({ className, icon }) => {
  const { isLoading } = useCanvasContext();

  if (!isLoading) return null;

  return (
    <div className={className || styles["reflct-loader"]}>
      {icon ? (
        icon
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.spin}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
    </div>
  );
};

export default LoadingIndicator;
