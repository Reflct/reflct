#!/bin/bash

# Exit on error
set -e

# Create temporary directory
root_dir=$(pwd)
dist_dir=$root_dir/dist

# Pack the React package
echo "Packing React package..."
cd $root_dir
npm run build
# cd $dist_dir
npm pack

tmp_dir=$root_dir/tmp
rm -rf $tmp_dir
mkdir -p $tmp_dir
mv reflct-react-*.tgz $tmp_dir/reflct-react.tgz

# Create Next.js app
echo "Creating Next.js app..."
(cd $tmp_dir; npx -y create-next-app@14 $tmp_dir/next-test --ts --no-tailwind --no-eslint --app --no-src-dir --import-alias "@/*")
(cd $tmp_dir/next-test; npm install ../reflct-react.tgz)


# Create example page
cat > $tmp_dir/next-test/app/page.tsx << 'EOL'
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

cat $root_dir/.env | sed 's/SCENE_ID/NEXT_PUBLIC_SCENE_ID/g' | sed 's/REFLCT_API_KEY/NEXT_PUBLIC_REFLCT_API_KEY/g' > $tmp_dir/next-test/.env

# Create React app
echo "Creating React app..."
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

echo "Setup complete! Test environments created in tmp/next-test and tmp/react-test"
