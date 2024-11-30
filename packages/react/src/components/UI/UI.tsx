import React from "react";
import { useCanvasContext } from "../../context";
import { ViewMetadata } from "../../types/common";
import { mapMetadataToRecord } from "../../utils/helper";
import ArrowControls from "../ArrowControls";
import AutomodeControls from "../AutomodeControls";
import LoadingIndicator from "../LoadingIndicator";

export type UIChild = (state: {
  index: number;
  currentView: ViewMetadata;
  currentViewGroup: ViewMetadata;
  global: ViewMetadata & {
    numberOfViews: number;
  };
  automode: boolean;
  setAutomode: (automode: boolean) => void;
  isLoading: boolean;
  nextView: () => void;
  prevView: () => void;
}) => React.ReactNode;

type Props = {
  ui?: UIChild;
};

const UI: React.FC<Props> = ({ ui }) => {
  const {
    isLoading,
    automode,
    setAutomode,
    state,
    setState,
    name,
    description,
    metadata,
    transitions,
    transitionGroups,
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
      },
      automode,
      setAutomode,
      isLoading,
      nextView,
      prevView,
    });
  }

  return (
    <>
      <AutomodeControls />
      <ArrowControls />
      <LoadingIndicator />
    </>
  );
};

export default UI;
