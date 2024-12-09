#!/bin/bash

# Exit on error
set -e

# Create temporary directory
PORT=5188

root_dir=$(pwd)
tmp_dir=$(mktemp -d)
env_dir=$tmp_dir/tmp

mkdir -p $env_dir

echo "root_dir: $root_dir"
echo "tmp_dir: $tmp_dir"
echo "env_dir: $env_dir"

# Copy everything except node_modules
rsync -av --exclude='node_modules' --exclude='.git' $root_dir/ $tmp_dir/

cp $tmp_dir/.env $tmp_dir/packages/api/.env
cp $tmp_dir/.env $tmp_dir/packages/react/.env

(cd $tmp_dir; npm install)

cd $tmp_dir/packages/api
npm run build
npm pack
mv reflct-api-*.tgz $tmp_dir/packages/react/reflct-api.tgz

(cd $tmp_dir/packages/react; npm pkg set dependencies.@reflct/api=./reflct-api.tgz)
cd $tmp_dir/packages/react
npm run build
npm pack
mv reflct-react-*.tgz $env_dir/reflct-react.tgz
mv reflct-api.tgz $env_dir/reflct-api.tgz

# # Create Next.js app
echo "Creating Next.js app..."
(cd $env_dir; npx -y create-next-app@14 $env_dir/next-test --ts --no-tailwind --no-eslint --app --no-src-dir --import-alias "@/*")
(cd $env_dir/next-test; npm install ../reflct-react.tgz)

# # Create example page
cat > $env_dir/next-test/app/page.tsx << 'EOL'
"use client";

import { Viewer } from "@reflct/react";

export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <Viewer
        id={process.env.NEXT_PUBLIC_SCENE_ID || ""}
        apikey={process.env.NEXT_PUBLIC_REFLCT_API_KEY || ""}
        sharedMemoryForWorkers={false}
      />
    </main>
  );
}
EOL

cat $tmp_dir/.env | sed 's/SCENE_ID/NEXT_PUBLIC_SCENE_ID/g' | sed 's/REFLCT_API_KEY/NEXT_PUBLIC_REFLCT_API_KEY/g' > $env_dir/next-test/.env

# # Create React app
# echo "Creating React app..."
(cd $tmp_dir; npm create -y vite@latest tmp/vite-test -- --template react-ts)
(cd $tmp_dir/vite-test; npm install ../reflct-react.tgz)

# Update App.tsx
cat > $tmp_dir/vite-test/src/App.tsx << 'EOL'
"use client";

import { Viewer } from "@reflct/react";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Viewer
        id={import.meta.env.VITE_SCENE_ID || "a"}
        apikey={import.meta.env.VITE_API_KEY || "b"}
        sharedMemoryForWorkers={false}
      />
    </div>
  );
}

export default App;
EOL

cat $root_dir/.env | sed 's/SCENE_ID/VITE_SCENE_ID/g' | sed 's/REFLCT_API_KEY/VITE_API_KEY/g' > $tmp_dir/vite-test/.env

echo "Setup complete! Test environments created in $tmp_dir"
