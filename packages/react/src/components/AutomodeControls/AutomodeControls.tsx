import React from "react";
import { useCanvasContext } from "../../context";

import styles from "./AutomodeControls.module.css";

const AutomodeControls: React.FC = () => {
  const { automode, setAutomode } = useCanvasContext();

  return (
    <div className={styles["reflct-controls"]}>
      <button
        className={`${styles["button"]} ${!automode ? styles["active"] : ""}`}
        onClick={() => {
          setAutomode(false);
        }}
      >
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
          <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
          <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      </button>
      <hr />
      <button
        className={`${styles["button"]} ${automode ? styles["active"] : ""}`}
        onClick={() => {
          setAutomode(true);
        }}
      >
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
          <path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8h8" />
          <polyline points="16 14 20 18 16 22" />
        </svg>
      </button>
    </div>
  );
};

export default AutomodeControls;
