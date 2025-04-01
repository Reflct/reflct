import { Html } from "@react-three/drei";
import React from "react";
import { useCanvasContext } from "../../context";
import styles from "./HitPoints.module.css";

export type HitPoint = (state: {
  index: number;
  isSelected: boolean;
  inCurrentGroup: boolean;
  select: () => void;
}) => React.ReactNode;

const HitPoints: React.FC<{ hitPoint?: HitPoint }> = ({ hitPoint }) => {
  const {
    isLoading,
    state,
    transitionGroups,
    transitions,
    setState,
    automode,
  } = useCanvasContext();

  if (isLoading) {
    return null;
  }

  const currentTransition = transitions.at(state % transitions.length);
  const currentTransitionGroup = transitionGroups?.find((group) =>
    group.transitions.find((x) => x.id === currentTransition?.id)
  );

  if (hitPoint) {
    return (
      <>
        {transitionGroups.flatMap((group) => {
          const inCurrentGroup = Boolean(
            group.transitions.find((x) => x.id === currentTransition?.id)
          );

          return group.transitions.map((transition) => {
            const { id, item: transitionItem, showHitPoint } = transition;

            const index = transitions.findIndex((x) => x.id === id);
            const isSelected = id === currentTransition?.id;

            if (!showHitPoint) {
              return null;
            }

            return (
              <Html
                key={id}
                position={transitionItem.lookAt}
                zIndexRange={[0, 1]}
              >
                {hitPoint({
                  index,
                  isSelected,
                  inCurrentGroup,
                  select: () => setState(index % transitions.length),
                })}
              </Html>
            );
          });
        })}
      </>
    );
  }

  return (
    <>
      {currentTransitionGroup?.transitions.map((transition) => {
        const { id, item: transitionItem, showHitPoint } = transition;

        if (!showHitPoint) {
          return null;
        }

        const index = transitions.findIndex((x) => x.id === id);

        const isSelected = id === currentTransition?.id;

        return (
          <Html key={id} position={transitionItem.lookAt} zIndexRange={[0, 1]}>
            <button
              className={`${styles["hit-point"]} ${isSelected ? styles["selected"] : ""}`}
              onClick={() => {
                if (automode) {
                  return;
                }

                setState(index % transitions.length);
              }}
            >
              <div className={styles["indicator"]}>
                <div className={styles["center"]}></div>
              </div>
            </button>
          </Html>
        );
      })}
    </>
  );
};

export default HitPoints;
