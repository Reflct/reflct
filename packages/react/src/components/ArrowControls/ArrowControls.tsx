import React from "react";

import { useCanvasContext } from "../../context";
import styles from "./ArrowControls.module.css";

type Props = {
  icons?: {
    left?: React.ReactNode;
    right?: React.ReactNode;
  };
};

const ArrowControls: React.FC<Props> = ({ icons }) => {
  const { automode, state, setState } = useCanvasContext();

  return (
    <div
      className={`${styles["reflct-controls"]} ${automode ? styles["inactive"] : ""}`}
    >
      <button className={styles["button"]} onClick={() => setState(state - 1)}>
        {icons?.left ? (
          icons.left
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        )}
      </button>
      <button className={styles["button"]} onClick={() => setState(state + 1)}>
        {icons?.right ? (
          icons.right
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ArrowControls;
