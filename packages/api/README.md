# @reflct/api

An api client for Reflct 3D scenes.

## Installation

To install the package, run:

```bash
npm install @reflct/api
```

or if you're using yarn:

```bash
yarn add @reflct/api
```

## How to use

```js
import { client } from "@reflct/api";

// Get scene data
await client.getScene(id, apikey);

// Get preview scene data
await client.getPreviewScene(id, apikey);

## Licence

This project is MIT licensed.

## Authors

- In Ha Ryu <inha.ryu.97@gmail.com>
```
