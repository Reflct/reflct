import { SceneDto } from "@reflct/api";
import * as pc from "playcanvas";
import React, { useEffect, useRef } from "react";
import { useCanvasContext } from "../../context/CanvasContext";
import { getHitPointInstance, HitPointEvents } from "../../scripts/hitpoints";
import styles from "./HitPoints.module.css";

export type HitPoint = (state: {
  index: number;
  isSelected: boolean;
  inCurrentGroup: boolean;
  select: () => void;
}) => React.ReactNode;

const HitPointWrapper = ({
  transition,
  children,
}: {
  transition: SceneDto["data"]["transitionGroups"][0]["transitions"][0];
  children: React.ReactNode;
}) => {
  const { sceneData } = useCanvasContext();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hitPointInstance = getHitPointInstance(`hitpoints-${sceneData?.id}`);
    if (!hitPointInstance) return;

    const onCameraUpdate = (data: HitPointEvents["hitPointUpdate"]) => {
      if (!ref.current) return;

      if (data.isVisible) {
        ref.current.style.visibility = "visible";
      } else {
        ref.current.style.visibility = "hidden";
      }

      ref.current.style.transform = `translate(${data.screenX}px, ${data.screenY}px)`;
    };

    hitPointInstance.addHitPoint(
      transition.id,
      new pc.Vec3(
        transition.item.lookAt[0],
        transition.item.lookAt[1],
        transition.item.lookAt[2]
      ),
      onCameraUpdate
    );

    return () => {
      hitPointInstance.removeHitPoint(transition.id, onCameraUpdate);
    };
  }, [transition, sceneData]);

  return (
    <div className={styles["hit-point-wrapper"]} ref={ref}>
      {children}
    </div>
  );
};

const HitPoints: React.FC<{ hitPoint?: HitPoint }> = ({ hitPoint }) => {
  const {
    isLoading,
    state,
    views,
    currentView,
    currentViewGroup,
    sceneData,
    automode,
    actionsRef,
  } = useCanvasContext();

  if (isLoading) {
    return null;
  }

  if (hitPoint) {
    return (
      <>
        {sceneData?.data.transitionGroups.flatMap((group) => {
          const inCurrentGroup = Boolean(
            group.transitions.find((x) => x.id === currentView?.id)
          );

          return group.transitions.map((transition) => {
            const { id, item: transitionItem, showHitPoint } = transition;

            const index = views.findIndex((x) => x.id === id);
            const isSelected = id === currentView?.id;

            if (!showHitPoint) {
              return null;
            }

            return (
              <HitPointWrapper transition={transition} key={id}>
                {hitPoint({
                  index,
                  isSelected,
                  inCurrentGroup,
                  select: () => {
                    actionsRef.current.setState(index);
                  },
                })}
              </HitPointWrapper>
            );
          });
        })}
      </>
    );
  }

  return (
    <>
      {currentViewGroup?.transitions.map((transition) => {
        const { id, item: transitionItem, showHitPoint } = transition;

        if (!showHitPoint) {
          return null;
        }

        const index = views.findIndex((x) => x.id === id);

        const isSelected = id === currentView?.id;

        return (
          <HitPointWrapper transition={transition} key={id}>
            <button
              className={`${styles["hit-point"]} ${
                isSelected ? styles["selected"] : ""
              }`}
              onClick={() => {
                if (automode) {
                  return;
                }

                actionsRef.current.setState(index);
              }}
            >
              <div className={styles["indicator"]}>
                <div className={styles["center"]}></div>
              </div>
            </button>
          </HitPointWrapper>
        );
      })}
    </>
  );
};

export default HitPoints;
