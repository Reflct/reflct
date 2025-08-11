import React from "react";
import { useCanvasContext } from "../../context/CanvasContext";
import {
  CurrentViewMetadata,
  GlobalMetadata,
  ViewGroupMetadata,
} from "../../types/common";
import ArrowControls from "./ArrowControls/ArrowControls";
import LinkedSceneControls from "./LinkedSceneControls/LinkedSceneControls";
import LoadingIndicator from "./LoadingIndicator/LoadingIndicator";
import TextDetails from "./TextDetails/TextDetails";
import { mapMetadataToRecord } from "../../utils/helper";

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
    currentState,
    views,
    sceneData,
    actionsRef,
  } = useCanvasContext();

  if (ui) {
    const currentTransition = views.at(currentState);
    const currentTransitionGroup = sceneData?.data.transitionGroups?.find(
      (group) => group.transitions.find((x) => x.id === currentTransition?.id)
    );

    const nextView = () => {
      if (isLoading || automode) {
        return;
      }

      actionsRef.current.setState(currentState + 1);
    };

    const prevView = () => {
      if (isLoading || automode) {
        return;
      }

      actionsRef.current.setState(currentState - 1);
    };

    return ui({
      index: currentState,
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
        title: sceneData?.name ?? "",
        description: sceneData?.description ?? "",
        metadata: mapMetadataToRecord(sceneData?.metadata ?? {}),
        numberOfViews: views.length,
        summaryImage: sceneData?.summaryImage ?? null,
        linkedScenes: sceneData?.linkedScenes ?? [],
      },
      automode,
      setAutomode: actionsRef.current.setAutomode,
      isLoading,
      loadProgress,
      nextView,
      prevView,
      loadScene: actionsRef.current.loadScene,
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
