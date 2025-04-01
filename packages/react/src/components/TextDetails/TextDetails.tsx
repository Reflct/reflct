import React, { useEffect, useState } from "react";
import { useCanvasContext } from "../../context";

import styles from "./TextDetails.module.css";
import containerStyles from "../../css/Container.module.css";

const TextDetails: React.FC = () => {
  const { isLoading, state, transitions } = useCanvasContext();

  const [showTextDetails, setShowTextDetails] = useState(false);

  useEffect(() => {
    setShowTextDetails(true);
  }, [state]);

  const currentTransition = transitions.at(state % transitions.length);

  if (isLoading || !currentTransition?.showTextDetails || !showTextDetails) {
    return null;
  }

  return (
    <div
      className={`${containerStyles["reflct-text-details"]} ${styles["reflct-text-details"]}`}
    >
      <h3>{currentTransition.title}</h3>
      {currentTransition.description && (
        <div
          className={styles["reflct-text-details-description"]}
          dangerouslySetInnerHTML={{ __html: currentTransition.description }}
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
