import React from "react";
import { useCanvasContext } from "../../context";
import { ViewMetadata } from "../../types/common";
import { mapMetadataToRecord } from "../../utils/helper";
import ArrowControls from "../ArrowControls";
import AutomodeControls from "../AutomodeControls";
import LoadingIndicator from "../LoadingIndicator";
import { LinkedScene } from "@reflct/api";
import LinkedSceneControls from "../LinkedSceneControls/LinkedSceneControls";

export type UIChild = (state: {
  index: number;
  currentView: ViewMetadata;
  currentViewGroup: ViewMetadata;
  global: ViewMetadata & {
    numberOfViews: number;
    summaryImage: string | null;
    linkedScenes: LinkedScene[];
  };
  automode: boolean;
  setAutomode: (automode: boolean) => void;
  isLoading: boolean;
  loadProgress: number;
  nextView: () => void;
  prevView: () => void;
  loadScene: (sceneId: string) => Promise<void>;
}) => React.ReactNode;

type Props = {
  ui?: UIChild;
};

const UI: React.FC<Props> = ({ ui }) => {
  const {
    isLoading,
    loadProgress,
    automode,
    setAutomode,
    state,
    setState,
    name,
    description,
    metadata,
    transitions,
    transitionGroups,
    linkedScenes,
    summaryImage,
    loadScene,
  } = useCanvasContext();

  if (ui) {
    const currentTransition = transitions.at(state % transitions.length);
    const currentTransitionGroup = transitionGroups?.find((group) =>
      group.transitions.find((x) => x.id === currentTransition?.id)
    );

    const nextView = () => {
      setState((state + 1) % transitions.length);
    };

    const prevView = () => {
      setState((state - 1) % transitions.length);
    };

    return ui({
      index: state,
      currentView: {
        title: currentTransition?.title,
        description: currentTransition?.description,
        metadata: mapMetadataToRecord(currentTransition?.metadata ?? {}),
      },
      currentViewGroup: {
        title: currentTransitionGroup?.title,
        description: currentTransitionGroup?.description,
        metadata: mapMetadataToRecord(currentTransitionGroup?.metadata ?? {}),
      },
      global: {
        title: name ?? "",
        description: description ?? "",
        metadata: mapMetadataToRecord(metadata ?? {}),
        numberOfViews: transitions.length,
        linkedScenes,
        summaryImage,
      },
      automode,
      setAutomode,
      isLoading,
      loadProgress,
      nextView,
      prevView,
      loadScene,
    });
  }

  return (
    <>
      <AutomodeControls />
      <ArrowControls />
      <LoadingIndicator />
      <LinkedSceneControls />
    </>
  );
};

export default UI;
