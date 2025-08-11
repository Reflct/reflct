import React from "react";
import styles from "./ErrorHandler.module.css";
import { useCanvasContext } from "../../context/CanvasContext";

const ErrorHandler: React.FC = () => {
  const { error } = useCanvasContext();

  if (error) return <div className={styles.error}>{error.message}</div>;
};

export default ErrorHandler;
