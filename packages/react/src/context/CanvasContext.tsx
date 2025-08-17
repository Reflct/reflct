import { client, SceneDto, ReflctApiError } from "@reflct/api";
import gsap from "gsap";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CameraInfo,
  CurrentViewMetadata,
  GlobalMetadata,
  ViewGroupMetadata,
} from "../types/common";

type CanvasContextActionsType = {
  getCurrentState: () => number;
  setCurrentState: (state: number) => void;
  getViews: () => SceneDto["data"]["transitionGroups"][0]["transitions"];
  setState: (state: number) => void;
  getTransitionSpeedMultiplier: () => number;
  getAutomode: () => boolean;
  setAutomode: (automode: boolean) => void;
  loadScene: (sceneId: string) => Promise<void>;
};

type CanvasContextBaseType = {
  id: string;
  apikey: string;
  isPreview?: boolean;
  state?: number;
  transitionSpeedMultiplier: number;
  automodeTransitionSpeedMultiplier: number;
};

export type CanvasContextEventsType = {
  onLoadStart?: () => void;
  onLoadProgressUpdate?: (progress: number) => void;
  onLoadComplete?: (
    viewGroups: ViewGroupMetadata[],
    global: GlobalMetadata,
    camera: CameraInfo | null
  ) => void;
  onStateChangeStart?: (
    targetView: CurrentViewMetadata,
    targetViewGroup: ViewGroupMetadata,
    global: GlobalMetadata,
    camera: CameraInfo | null
  ) => void;
  onStateChangeComplete?: (
    currentView: CurrentViewMetadata,
    currentViewGroup: ViewGroupMetadata,
    global: GlobalMetadata,
    camera: CameraInfo | null
  ) => void;
  onError?: (error: ReflctApiError) => void;
};

type CanvasContextType = CanvasContextBaseType & {
  sceneData: SceneDto | null;
  views: SceneDto["data"]["transitionGroups"][0]["transitions"];
  currentView: SceneDto["data"]["transitionGroups"][0]["transitions"][0] | null;
  currentViewGroup: SceneDto["data"]["transitionGroups"][0] | null;
  currentState: number;
  automode: boolean;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  loadProgress: number;
  setLoadProgress: (loadProgress: number) => void;
  error: ReflctApiError | null;
  eventsRef: React.MutableRefObject<CanvasContextEventsType>;
  cameraRef: React.MutableRefObject<CameraInfo | null>;
  actionsRef: React.MutableRefObject<CanvasContextActionsType>;
};

export const CanvasContext = createContext<CanvasContextType>({
  id: "",
  apikey: "",
  isPreview: false,
  state: 0,
  transitionSpeedMultiplier: 1,
  automodeTransitionSpeedMultiplier: 0.5,
  sceneData: null,
  views: [],
  currentView: null,
  currentViewGroup: null,
  currentState: 0,
  automode: false,
  isLoading: false,
  setIsLoading: () => {},
  loadProgress: 0,
  setLoadProgress: () => {},
  error: null,
  eventsRef: { current: {} },
  cameraRef: { current: null },
  actionsRef: {
    current: {
      getCurrentState: () => 0,
      setCurrentState: () => {},
      getViews: () => [],
      setState: () => {},
      getTransitionSpeedMultiplier: () => 1,
      getAutomode: () => false,
      setAutomode: () => {},
      loadScene: () => Promise.resolve(),
    },
  },
});

type CanvasContextProviderProps = {
  value: CanvasContextBaseType;
  events: CanvasContextEventsType;
  children: React.ReactNode;
};

export const CanvasContextProvider: React.FC<CanvasContextProviderProps> = ({
  value,
  events,
  children,
}) => {
  const {
    id,
    apikey,
    state = 0,
    isPreview,
    transitionSpeedMultiplier,
    automodeTransitionSpeedMultiplier,
  } = value;

  const dataRef = useRef<{
    isFetching: boolean;
  }>({
    isFetching: false,
  });

  const cameraRef = useRef<CameraInfo | null>(null);
  const eventsRef = useRef<CanvasContextEventsType>(events);
  const actionsRef = useRef<CanvasContextActionsType>({
    getCurrentState: () => 0,
    setCurrentState: () => {},
    getViews: () => [],
    setState: () => {},
    getTransitionSpeedMultiplier: () => 1,
    getAutomode: () => false,
    setAutomode: () => {},
    loadScene: () => Promise.resolve(),
  });

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const [sceneData, setSceneData] = useState<SceneDto | null>(null);
  const [currentView, setCurrentView] = useState<
    SceneDto["data"]["transitionGroups"][0]["transitions"][0] | null
  >(null);
  const [currentViewGroup, setCurrentViewGroup] = useState<
    SceneDto["data"]["transitionGroups"][0] | null
  >(null);
  const [views, setViews] = useState<
    SceneDto["data"]["transitionGroups"][0]["transitions"]
  >([]);
  const [automode, setAutomode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);

  const [currentState, setCurrentState] = useState<number>(state);

  const [error, setError] = useState<ReflctApiError | null>(null);

  const fetchData = useCallback(
    async (id: string, apikey: string, isPreview?: boolean) => {
      if (dataRef.current.isFetching) {
        return;
      }

      try {
        dataRef.current.isFetching = true;

        setIsLoading(true);
        eventsRef.current.onLoadStart?.();

        const response = isPreview
          ? await client.getPreviewScene(id, apikey)
          : await client.getScene(id, apikey);

        setSceneData(response);
        setCurrentView(
          response.data.transitionGroups?.[0]?.transitions?.[0] ||
            response.data.camera
        );
        setViews(
          response.data.transitionGroups.flatMap((group) => group.transitions)
        );
      } catch (error) {
        console.error(error);

        if (error instanceof ReflctApiError) {
          setError(error);
        } else {
          setError(
            new ReflctApiError("internal_server_error", "Something went wrong")
          );
        }
      } finally {
        dataRef.current.isFetching = false;
      }
    },
    []
  );

  useEffect(() => {
    if (error) {
      eventsRef.current.onError?.(error);
    }
  }, [error]);

  useEffect(() => {
    fetchData(id, apikey, isPreview);
  }, []);

  useEffect(() => {
    if (currentState !== state) {
      setCurrentState(state);
    }
  }, [state]);

  useEffect(() => {
    actionsRef.current.getCurrentState = () => currentState;
    actionsRef.current.setCurrentState = (state: number) => {
      const length = views.length;

      setCurrentState((state + length) % length);
    };
    actionsRef.current.getViews = () => {
      return views;
    };
    actionsRef.current.getTransitionSpeedMultiplier = () =>
      automode ? automodeTransitionSpeedMultiplier : transitionSpeedMultiplier;
    actionsRef.current.getAutomode = () => automode;
    actionsRef.current.setAutomode = (automode: boolean) => {
      setAutomode(automode);
    };
    actionsRef.current.loadScene = async (sceneId: string) => {
      setIsLoading(true);
      setLoadProgress(0);

      setSceneData(null);
      setCurrentView(null);
      setViews([]);

      setCurrentState(0);

      setAutomode(false);

      setError(null);

      await fetchData(sceneId, apikey, isPreview);
    };
  }, [
    currentState,
    views,
    automode,
    automodeTransitionSpeedMultiplier,
    transitionSpeedMultiplier,
  ]);

  useEffect(() => {
    setCurrentView(views[currentState]);
  }, [currentState]);

  useEffect(() => {
    setCurrentViewGroup(
      sceneData?.data.transitionGroups.find((group) =>
        group.transitions.find((x) => x.id === currentView?.id)
      ) || null
    );
  }, [currentView]);

  useEffect(() => {
    if (!automode) {
      return;
    }

    actionsRef.current.setState(actionsRef.current.getCurrentState() + 1);
  }, [automode]);

  return (
    <CanvasContext.Provider
      value={{
        ...value,
        automode,
        sceneData,
        views,
        currentState,
        currentView,
        currentViewGroup,
        error,
        eventsRef,
        cameraRef,
        actionsRef,
        isLoading,
        setIsLoading,
        loadProgress,
        setLoadProgress,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);

  if (!context) {
    throw new Error(
      "useCustomContext must be used within a CustomContextProvider"
    );
  }

  return context;
};
