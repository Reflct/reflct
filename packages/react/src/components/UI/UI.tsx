import React from "react";
import { useCanvasContext } from "../../context";
import {
  CurrentViewMetadata,
  GlobalMetadata,
  ViewGroupMetadata,
} from "../../types/common";
import { mapMetadataToRecord } from "../../utils/helper";
import ArrowControls from "../ArrowControls";
import LinkedSceneControls from "../LinkedSceneControls/LinkedSceneControls";
import LoadingIndicator from "../LoadingIndicator";
import TextDetails from "../TextDetails";

export type UIChild = (state: {
  index: number;
  currentView: CurrentViewMetadata;
  currentViewGroup: ViewGroupMetadata;
  global: GlobalMetadata;
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
      if (isLoading || automode) {
        return;
      }

      setState((state + 1) % transitions.length);
    };

    const prevView = () => {
      if (isLoading || automode) {
        return;
      }

      setState((state - 1) % transitions.length);
    };

    return ui({
      index: state,
      currentView: {
        title: currentTransition?.title,
        description: currentTransition?.description,
        metadata: mapMetadataToRecord(currentTransition?.metadata ?? {}),
        showTextDetails: currentTransition?.showTextDetails,
      },
      currentViewGroup: {
        title: currentTransitionGroup?.title,
        description: currentTransitionGroup?.description,
        metadata: mapMetadataToRecord(currentTransitionGroup?.metadata ?? {}),
        views:
          currentTransitionGroup?.transitions.map((view) => ({
            title: view.title,
            description: view.description,
            metadata: mapMetadataToRecord(view.metadata ?? {}),
            showTextDetails: view.showTextDetails,
          })) || [],
      },
      global: {
        title: name ?? "",
        description: description ?? "",
        metadata: mapMetadataToRecord(metadata ?? {}),
        numberOfViews: transitions.length,
        summaryImage,
        linkedScenes,
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
      <ArrowControls />
      <LoadingIndicator />
      <LinkedSceneControls />
      <TextDetails />
    </>
  );
};

export default UI;
