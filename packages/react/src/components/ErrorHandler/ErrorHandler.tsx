import React from "react";
import styles from "./ErrorHandler.module.css";
import { useCanvasContext } from "../../context/CanvasContext";

const ErrorHandler: React.FC = () => {
  const { error } = useCanvasContext();

  if (!error) return;

  if (
    error.type === "integration_not_enabled" ||
    error.type === "integration_not_allowed"
  ) {
    return (
      <div className={styles.error}>
        <span>
          Account error - contact{" "}
          <a
            className=""
            href="https://reflct.app"
            target="_blank"
            rel="noreferrer"
          >
            Reflct
          </a>
        </span>
      </div>
    );
  }

  return <div className={styles.error}>{error.message}</div>;
};

export default ErrorHandler;
