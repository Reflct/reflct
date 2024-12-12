import React from "react";
import { useCanvasContext } from "../../context";
import styles from "./Background.module.css";

const Background = () => {
  const { backgroundColor } = useCanvasContext();

  return (
    <div
      className={styles["reflct-background"]}
      style={{ backgroundColor: backgroundColor || "#F4F5F5FF" }}
    ></div>
  );
};

export default Background;
