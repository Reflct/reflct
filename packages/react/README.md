# @reflct/react

A React library for integrating Reflct 3D scenes into your React apps.

## Installation

To install the package, run:

```bash
npm install @reflct/react
```

or if you're using yarn:

```bash
yarn add @reflct/react
```

## Getting Started

Here's a basic example of how to use the Viewer component:

```jsx
import React from "react";
import { Viewer } from "@reflct/react";

const Page = () => {
  return <Viewer id={"your-scene-id"} apikey={"your-apikey"} />;
};

export default Page;
```

## Advanced Usage

Viewer component has props for listening to events and customizing the UI.

```jsx
<Viewer
  id={"your-scene-id"}
  apikey={"your-apikey"}
  isPreview={true}
  sharedMemoryForWorkers={false}
  className={"your-class-name"}
  transitionSpeedMultiplier={1.0}
  automodeTransitionSpeedMultiplier={0.5}
  // events
  onLoadStart={() => {}}
  onLoadProgressUpdate={(progress: number) => {}}
  onLoadComplete={(viewGroups, global) => {}}
  onStateChangeStart={(targetView, targetViewGroup, global) => {}}
  onStateChangeComplete={(currentView, currentViewGroup, global) => {}}
  onError={(error: string) => {}}
/>
```

Here are the basic props for the Viewer component:

| Props                             | Type    | Description                                                        |
| --------------------------------- | ------- | ------------------------------------------------------------------ |
| id                                | string  | Your scene id                                                      |
| apikey                            | string  | Your api key                                                       |
| isPreview                         | boolean | Whether to use preview scene                                       |
| sharedMemoryForWorkers            | boolean | Whether to use shared memory for workers                           |
| className                         | string  | class name for the viewer                                          |
| transitionSpeedMultiplier         | number  | Speed multiplier for camera transitions (default: 1)               |
| automodeTransitionSpeedMultiplier | number  | Speed multiplier for camera transitions in automode (default: 0.5) |

These are the events fired by the Viewer component:

| Events                | Type                                                                                                                                | Description                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| onLoadStart           | () => void                                                                                                                          | Called when the scene is loading.  |
| onLoadProgressUpdate  | (progress: number) => void                                                                                                          | Called when the scene is loading.  |
| onLoadComplete        | (viewGroups: ViewGroupMetadata[], global: GlobalMetadata, camera: CameraInfo \| null) => void                                       | Called when the scene is loaded.   |
| onStateChangeStart    | (targetView: CurrentViewMetadata, targetViewGroup: ViewGroupMetadata, global: GlobalMetadata, camera: CameraInfo \| null) => void   | Called when the scene is changing. |
| onStateChangeComplete | (currentView: CurrentViewMetadata, currentViewGroup: ViewGroupMetadata, global: GlobalMetadata, camera: CameraInfo \| null) => void | Called when the scene is changed.  |
| onError               | (error: string) => void                                                                                                             | Called when the scene is error.    |

Where `LinkedScene`, `ViewMetadata`, `CurrentViewMetadata`, `ViewGroupMetadata`, `GlobalMetadata`, and `CameraInfo` are defined as follows:

```ts
export type LinkedScene = {
  id: string;
  name: string;
};

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
```

These Events and metadata that are passed in the events could be used to run logics in your application, such as updating the UI or state.
The `CameraInfo` object provides methods to override controls to the the camera position, lookat point, and zoom level programmatically.

```jsx
import React from "react";
import { Viewer } from "@reflct/react";
import useProductStore from "../stores/product-store";

const Page = () => {
  const extractMetadataOnLoad = (
    viewGroups: {
      title?: string,
      description?: string,
      metadata?: Record<string, string>,
      views: {
        title?: string,
        description?: string,
        metadata?: Record<string, string>,
      }[],
    }[],
    global: {
      title?: string,
      description?: string,
      metadata?: Record<string, string>,
      numberOfViews: number,
      summaryImage: string | null,
      linkedScenes: LinkedScene[],
    },
    key: string
  ) => {
    return (
      viewGroups[0].views[0].metadata?.[key] ||
      viewGroups[0].metadata?.[key] ||
      global.metadata?.[key]
    );
  };

  return (
    <Viewer
      id={sceneId}
      apikey={apikey}
      onLoadComplete={(viewGroups, global) => {
        useProductStore.setState((state) => {
          state.loading = false;
          state.title = extractMetadataOnLoad(
            viewGroups,
            global,
            "productTitle"
          );
          state.subtitle = extractMetadataOnLoad(
            viewGroups,
            global,
            "productCategory"
          );
          const price = extractMetadataOnLoad(viewGroups, global, "price");
          const priceNumber = Number(price);

          state.price = !isNaN(priceNumber) && priceNumber;
        });
      }}
      onStateChangeStart={(view, viewGroup, global) => {
        useProductStore.setState((state) => {
          state.title = extractMetadataOnStateChange(
            view,
            viewGroup,
            global,
            "productTitle"
          );
          state.subtitle = extractMetadataOnStateChange(
            view,
            viewGroup,
            global,
            "productCategory"
          );
          const price = extractMetadataOnStateChange(
            view,
            viewGroup,
            global,
            "price"
          );
          const priceNumber = Number(price);

          state.price = !isNaN(priceNumber) && priceNumber;
        });
      }}
    />
  );
};
```

If you wish to customise the UIs of the viewer component, you can do those by giving the children.

```jsx
<Viewer id={"your-scene-id"} apikey={"your-apikey"}>
  {({
    currentView,
    currentViewGroup,
    global,
    index,
    automode,
    setAutomode,
    isLoading,
    loadProgress,
    nextView,
    prevView,
    summaryImage,
    linkedScenes,
    loadScene,
  }) => {
    return <div>Controls {/* what ever you want to render */}</div>;
  }}
</Viewer>
```

| Props            | Type                                        | Description                             |
| ---------------- | ------------------------------------------- | --------------------------------------- |
| currentView      | CurrentViewMetadata                         | The current view metadata               |
| currentViewGroup | ViewGroupMetadata                           | The current view group metadata         |
| global           | GlobalMetadata                              | The global metadata                     |
| index            | number                                      | The current index of the views          |
| automode         | boolean                                     | Whether the automode is enabled         |
| setAutomode      | function (automode: boolean)                | The function to set the automode        |
| isLoading        | boolean                                     | Whether the scene is loading            |
| loadProgress     | number                                      | The progress of the scene loading       |
| nextView         | function (() => void)                       | The function to go to the next view     |
| prevView         | function (() => void)                       | The function to go to the previous view |
| summaryImage     | string or null                              | The summary image of the scene          |
| linkedScenes     | { id: string; name: string; }[]             | The linked scenes of the scene          |
| loadScene        | function (sceneId: string) => Promise<void> | The function to load the scene          |

If you wish to customise the UI of the hitpoints, you can do that by giving the `hitPoint` prop.

```jsx
<Viewer
  id={"your-scene-id"}
  apikey={"your-apikey"}
  hitPoint={(state: {
    index: number,
    isSelected: boolean,
    inCurrentGroup: boolean,
    select: () => void,
  }) => <button onClick={state.select}>Hitpoint</button>}
/>
```

| Props          | Type                  | Description                                       |
| -------------- | --------------------- | ------------------------------------------------- |
| index          | number                | The index of the hitpoint                         |
| isSelected     | boolean               | Whether the hitpoint is selected                  |
| inCurrentGroup | boolean               | Whether the hitpoint is in the current view group |
| select         | function (() => void) | The function to select the hitpoint               |

## CORS issues and SharedArrayBuffer

This package uses SharedArrayBuffer for performance as default. If you're using this in a browser environment, you may encounter CORS issues as stated here [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).
As a baseline requirement, your document needs to be in a secure context.
For top-level documents, two headers need to be set to cross-origin isolate your site:

- <u>Cross-Origin-Opener-Policy</u> with <i>same-origin</i> as value (protects your origin from attackers)
- <u>Cross-Origin-Embedder-Policy</u> with <i>require-corp</i> or <i>credentialless</i> as value (protects victims from your origin)
  As stated, you can set the following headers in your server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If this is not possible, you can disable SharedArrayBuffer by setting the `sharedMemoryForWorkers` prop to `false` in the Viewer component.

```jsx
<Viewer
  id={"your-scene-id"}
  apikey={"your-apikey"}
  sharedMemoryForWorkers={false}
/>
```

## License

See license in [LICENSE](./LICENSE)

## Authors

- In Ha Ryu <inha.ryu.97@gmail.com>
