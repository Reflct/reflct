import React, { useState } from "react";
import { useCanvasContext } from "../../context";

import styles from "./LinkedSceneControls.module.css";

const LinkedSceneControls = () => {
  const { linkedScenes, loadScene } = useCanvasContext();

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className={`${styles["reflct-linked-scenes"]} ${
        linkedScenes.length > 0 ? styles["show"] : ""
      }`}
    >
      <button
        className={styles["select"]}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        Other scenes
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
          className={`${styles["chevron"]} ${
            showDropdown ? styles["rotate"] : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`${styles["dropdown"]} ${
          showDropdown ? styles["show"] : ""
        }`}
      >
        {linkedScenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => {
              loadScene(scene.id);
              setShowDropdown(false);
            }}
          >
            {scene.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LinkedSceneControls;
