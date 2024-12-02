# @reflct/next

A Next.js wrapper of React library for rendering 3D scenes and objects using Three.js and Gaussian Splats.

## Installation

To install the package, run:

```bash
npm install @reflct/next
```

or if you're using yarn:

```bash
yarn add @reflct/next
```

## Dependencies

This package has the following peer dependencies:

- react
- three
- gsap
- @react-three/drei
- @react-three/fiber
- @mkkellogg/gaussian-splats-3d

Make sure to install these in your project if they're not already present.

## Usage

Here's a basic example of how to use the Canvas component:

```jsx
import React from "react";
import { Viewer } from "@reflct/react";

const App = () => {
  return <Viewer id={"your-scene-id"} apikey={"your-apikey"} />;
};

export default App;
```

## License

This project is licensed under the ISC License.

## Authors

- In Ha Ryu <inha.ryu.97@gmail.com>
