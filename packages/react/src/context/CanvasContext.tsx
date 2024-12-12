import gsap from "gsap";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { client } from "@reflct/api";
import type {
  PerspectiveCameraData,
  SceneDataDto,
  Transition,
} from "@reflct/api";
import { ViewMetadata } from "../types/common";

type CanvasContextBaseType = {
  id: string;
  apikey: string;
  isPreview?: boolean;
  sharedMemoryForWorkers?: boolean;
  state?: number;
};

export type CanvasContextEventsType = {
  onLoadStart?: () => void;
  onLoadProgressUpdate?: (progress: number) => void;
  onLoadComplete?: (
    viewGroups: {
      title?: string;
      description?: string;
      metadata?: Record<string, string>;
      views: ViewMetadata[];
    }[],
    global: {
      title?: string;
      description?: string;
      metadata?: Record<string, string>;
      numberOfViews: number;
    }
  ) => void;
  onStateChangeStart?: (
    targetView: ViewMetadata,
    targetViewGroup: ViewMetadata,
    global: {
      title?: string;
      description?: string;
      metadata?: Record<string, string>;
      numberOfViews: number;
    }
  ) => void;
  onStateChangeComplete?: (
    currentView: ViewMetadata,
    currentViewGroup: ViewMetadata,
    global: {
      title?: string;
      description?: string;
      metadata?: Record<string, string>;
      numberOfViews: number;
    }
  ) => void;
  onError?: (error: string) => void;
};

type CanvasContextType = CanvasContextBaseType & {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  automode: boolean;
  setAutomode: (automode: boolean) => void;

  name: string | null;
  description: string | null;
  metadata: Record<string, { value: string; updatedAt: string }> | null;
  camera: PerspectiveCameraData | null;
  items: SceneDataDto["items"];
  transitionGroups: SceneDataDto["transitionGroups"];
  transitions: Transition[];
  backgroundColor: string | null;
  state: number;
  setState: React.Dispatch<React.SetStateAction<number>>;
  dom: HTMLElement | null;
  setDom: (dom: HTMLElement | null) => void;
  error: Error | null;

  // events
  eventsRef: React.MutableRefObject<CanvasContextEventsType>;
  dataRef: React.MutableRefObject<{
    name?: string | null;
    description?: string | null;
    metadata?: Record<string, { value: string; updatedAt: string }> | null;
    camera?: PerspectiveCameraData | null;
    items?: SceneDataDto["items"];
    transitionGroups?: SceneDataDto["transitionGroups"];
    transitions?: Transition[];
    backgroundColor?: string | null;
  }>;
};

export const CanvasContext = createContext<CanvasContextType>({
  id: "",
  apikey: "",
  isLoading: true,
  automode: false,
  setAutomode: () => {},
  name: null,
  description: null,
  metadata: null,
  camera: null,
  state: 0,
  setState: () => {},
  setIsLoading: () => {},
  items: [],
  transitionGroups: [],
  transitions: [],
  backgroundColor: null,
  dom: null,
  setDom: () => {},
  error: null,
  sharedMemoryForWorkers: false,
  eventsRef: { current: {} },
  dataRef: { current: {} },
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
  const { id, apikey, state = 0, isPreview, sharedMemoryForWorkers } = value;

  const eventsRef = useRef<CanvasContextEventsType>(events);
  const dataRef = useRef<{
    name: string | null;
    description: string | null;
    metadata: Record<string, { value: string; updatedAt: string }> | null;
    camera: PerspectiveCameraData | null;
    items: SceneDataDto["items"];
    transitionGroups: SceneDataDto["transitionGroups"];
    transitions: Transition[];
    backgroundColor?: string | null;
  }>({
    name: null,
    description: null,
    metadata: null,
    camera: null,
    items: [],
    transitionGroups: [],
    transitions: [],
    backgroundColor: null,
  });

  const isFetchingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [automode, setAutomode] = useState(false);
  const [currentState, setCurrentState] = useState(state);

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<
    string,
    {
      value: string;
      updatedAt: string;
    }
  > | null>(null);
  const [camera, setCamera] = useState<PerspectiveCameraData | null>(null);
  const [items, setItems] = useState<SceneDataDto["items"]>([]);
  const [transitionGroups, setTransitionGroups] = useState<
    SceneDataDto["transitionGroups"]
  >([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);

  const [dom, setDom] = useState<HTMLElement | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isFetchingRef.current) {
      return;
    }

    const fetchData = async () => {
      try {
        isFetchingRef.current = true;

        eventsRef.current.onLoadStart?.();

        const response = isPreview
          ? await client.getPreviewScene(id, apikey)
          : await client.getScene(id, apikey);

        setName(response.name);
        setDescription(response.description);
        setMetadata(response.metadata ?? {});

        setItems(response.data.items);
        setTransitionGroups(response.data.transitionGroups);
        setTransitions(
          response.data.transitionGroups.flatMap((group) => group.transitions)
        );
        setCamera(response.data.camera);
        setBackgroundColor(response.backgroundColor);
      } catch (error) {
        setError(error as Error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchData();
  }, [id, apikey, isPreview]);

  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  useEffect(() => {
    if (!automode) {
      return;
    }

    setCurrentState((state) => (state + 1) % transitions.length);

    const animation = gsap
      .timeline({
        repeat: -1,
        duration: 3,
      })
      .call(() => {
        setCurrentState((state) => (state + 1) % transitions.length);
      });

    return () => {
      animation.kill();
    };
  }, [automode]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    dataRef.current = {
      name,
      description,
      metadata,
      camera,
      items,
      transitionGroups,
      transitions,
      backgroundColor,
    };
  }, [
    name,
    description,
    metadata,
    camera,
    items,
    transitionGroups,
    transitions,
    backgroundColor,
    dataRef,
  ]);

  return (
    <CanvasContext.Provider
      value={{
        ...value,
        isLoading,
        setIsLoading,
        automode,
        setAutomode,
        name,
        description,
        metadata,
        camera,
        items,
        transitionGroups,
        transitions,
        backgroundColor,
        state: currentState,
        setState: setCurrentState,
        dom,
        setDom,
        error,
        sharedMemoryForWorkers,
        eventsRef,
        dataRef,
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
