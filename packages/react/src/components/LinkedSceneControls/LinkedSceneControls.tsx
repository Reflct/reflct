import React, { useState } from "react";
import { useCanvasContext } from "../../context";

import styles from "./LinkedSceneControls.module.css";

const LinkedSceneControls = () => {
  const { linkedScenes, loadScene } = useCanvasContext();

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className={`${styles["reflct-linked-scenes"]} ${linkedScenes.length > 0 ? styles["show"] : ""}`}
    >
      <button
        className={`${styles["select"]} ${showDropdown ? styles["active"] : ""}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        Change scene
        <svg
          width="24"
          height="25"
          viewBox="0 0 24 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.5198 14.2687L8.36852 11.1177C8.32518 11.0742 8.29102 11.0256 8.26602 10.972C8.24102 10.9185 8.22852 10.8611 8.22852 10.7997C8.22852 10.6772 8.26993 10.5707 8.35277 10.4802C8.4356 10.3899 8.54477 10.3447 8.68027 10.3447H15.3188C15.4543 10.3447 15.5634 10.3904 15.6463 10.4817C15.7291 10.5729 15.7705 10.6793 15.7705 10.801C15.7705 10.8315 15.7238 10.9371 15.6303 11.1177L12.4793 14.2687C12.4069 14.3412 12.3321 14.3941 12.2548 14.4275C12.1774 14.4608 12.0923 14.4775 11.9995 14.4775C11.9067 14.4775 11.8216 14.4608 11.7443 14.4275C11.6669 14.3941 11.5921 14.3412 11.5198 14.2687Z"
            fill="white"
          />
        </svg>
      </button>

      <div
        className={`${styles["dropdown"]} ${showDropdown ? styles["show"] : ""}`}
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
