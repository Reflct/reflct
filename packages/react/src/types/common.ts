import { LinkedScene } from "@reflct/api";

export type ViewMetadata = {
  title?: string;
  description?: string;
  metadata?: Record<string, string>;
};

export type CurrentViewMetadata = ViewMetadata & {
  showTextDetails?: boolean;
};

export type ViewGroupMetadata = ViewMetadata & {
  views: ViewMetadata[];
};

export type GlobalMetadata = ViewMetadata & {
  numberOfViews: number;
  summaryImage: string | null;
  linkedScenes: LinkedScene[];
};

export type CameraInfo = {
  getPosition: () => [number, number, number];
  getLookat: () => [number, number, number];
  getZoom: () => number;
  setPosition: (position: [number, number, number]) => void;
  setLookat: (lookat: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
};
