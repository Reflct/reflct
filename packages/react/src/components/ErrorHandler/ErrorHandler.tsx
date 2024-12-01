import React from "react";
import styles from "./ErrorHandler.module.css";
import { useCanvasContext } from "../../context";

const ErrorHandler: React.FC = () => {
  const { error } = useCanvasContext();

  if (error)
    return (
      <div className={styles.error}>
        There was an error when fetching the content
      </div>
    );
};

export default ErrorHandler;
