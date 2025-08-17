import React, { useEffect, useState } from "react";
import { useCanvasContext } from "../../../context/CanvasContext";

import containerStyles from "../../Viewer.module.css";
import styles from "./TextDetails.module.css";

const TextDetails: React.FC = () => {
  const { isLoading, currentState, currentView } = useCanvasContext();

  const [showTextDetails, setShowTextDetails] = useState(false);

  useEffect(() => {
    setShowTextDetails(true);
  }, [currentState]);

  if (isLoading || !currentView?.showTextDetails || !showTextDetails) {
    return null;
  }

  return (
    <div
      className={`${containerStyles["reflct-text-details"]} ${styles["reflct-text-details"]}`}
    >
      <h3>{currentView.title}</h3>
      {currentView.description && (
        <div
          className={styles["reflct-text-details-description"]}
          dangerouslySetInnerHTML={{ __html: currentView.description }}
        />
      )}

      <div className={styles["close"]}>
        <button
          onClick={() => {
            setShowTextDetails(false);
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TextDetails;
