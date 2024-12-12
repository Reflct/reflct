# @reflct/react

A React library for integrating Reflct 3D scenes into your React apps.

Visit [Reflct.app](https://reflct.app) for more information.

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

| Props                  | Type    | Description                              |
| ---------------------- | ------- | ---------------------------------------- |
| id                     | string  | Your scene id                            |
| apikey                 | string  | Your api key                             |
| isPreview              | boolean | Whether to use preview scene             |
| sharedMemoryForWorkers | boolean | Whether to use shared memory for workers |
| className              | string  | class name for the viewer                |

These are the events fired by the Viewer component:

| Events                | Type                                                                                                                                                                                                                                   | Description                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| onLoadStart           | () => void                                                                                                                                                                                                                             | Called when the scene is loading.  |
| onLoadProgressUpdate  | (progress: number) => void                                                                                                                                                                                                             | Called when the scene is loading.  |
| onLoadComplete        | (viewGroups: { title?: string; description?: string; metadata?: Record<string, string>; views: ViewMetadata[]; }, global: { title?: string; description?: string; metadata?: Record<string, string>; numberOfViews: number; }) => void | Called when the scene is loaded.   |
| onStateChangeStart    | (targetView: ViewMetadata, targetViewGroup: ViewMetadata, global: { title?: string; description?: string; metadata?: Record<string, string>; numberOfViews: number; }) => void                                                         | Called when the scene is changing. |
| onStateChangeComplete | (currentView: ViewMetadata, currentViewGroup: ViewMetadata, global: { title?: string; description?: string; metadata?: Record<string, string>; numberOfViews: number; }) => void                                                       | Called when the scene is changed.  |
| onError               | (error: string) => void                                                                                                                                                                                                                | Called when the scene is error.    |

These Events and metadata that are passed in the events could be used to run logics in your application, such as updating the UI or state.

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
    nextView,
    prevView,
  }) => {
    return <div>Controls {/* what ever you want to render */}</div>;
  }}
</Viewer>
```

| Props            | Type                                                                                               | Description                             |
| ---------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------- |
| currentView      | { title?: string; description?: string; metadata?: Record<string, string> }                        | The current view metadata               |
| currentViewGroup | { title?: string; description?: string; metadata?: Record<string, string> }                        | The current view group metadata         |
| global           | { title?: string; description?: string; metadata?: Record<string, string>; numberOfViews: number } | The global metadata                     |
| index            | number                                                                                             | The current index of the views          |
| automode         | boolean                                                                                            | Whether the automode is enabled         |
| setAutomode      | function (automode: boolean)                                                                       | The function to set the automode        |
| isLoading        | boolean                                                                                            | Whether the scene is loading            |
| nextView         | function (() => void)                                                                              | The function to go to the next view     |
| prevView         | function (() => void)                                                                              | The function to go to the previous view |

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

## Licence

This project is MIT licensed.

## Authors

- In Ha Ryu <inha.ryu.97@gmail.com>
