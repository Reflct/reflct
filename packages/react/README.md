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
import "@reflct/react/style.css"; // Import the CSS for styling

const Page = () => {
  return <Viewer id={"your-scene-id"} apikey={"your-apikey"} />;
};

export default Page;
```

### CSS Styling

The package includes CSS modules for component styling. You can import the CSS in one of two ways:

1. **Import the main CSS file** (recommended):

   ```jsx
   import "@reflct/react/style.css";
   ```

2. **Import the CSS file directly**:
   ```jsx
   import "@reflct/react/dist/react-internal.css";
   ```

## Documentation

TBC.

## Licence

This project is MIT licensed.

## Authors

- In Ha Ryu <inha.ryu.97@gmail.com>
