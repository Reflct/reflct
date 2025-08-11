import React from "react";

import { useCanvasContext } from "../../../context/CanvasContext";
import styles from "./ArrowControls.module.css";

const ArrowControls: React.FC = () => {
  const { automode, state, actionsRef } = useCanvasContext();

  return (
    <div className={styles["reflct-controls"]}>
      <button
        className={styles["button"]}
        onClick={() => {
          if (automode) return;

          actionsRef.current.setState(actionsRef.current.getCurrentState() - 1);
        }}
        disabled={automode}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.166 15.0947L7.16602 10.0947L12.166 5.09473"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
      <button
        className={`${styles["button"]} ${styles["big"]}`}
        onClick={() => actionsRef.current.setAutomode(!automode)}
      >
        {automode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="6 3 20 12 6 21 6 3"></polygon>
          </svg>
        )}
      </button>
      <button
        className={styles["button"]}
        onClick={() => {
          if (automode) return;

          actionsRef.current.setState(actionsRef.current.getCurrentState() + 1);
        }}
        disabled={automode}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.83398 15.0947L13.834 10.0947L8.83398 5.09473"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default ArrowControls;
