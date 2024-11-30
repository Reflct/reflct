import dynamic from "next/dynamic";
import React from "react";

const ReactViewer = dynamic(
  () => import("@reflct/react").then((mod) => mod.Viewer),
  {
    ssr: false,
  }
);

const Viewer: React.FC<React.ComponentProps<typeof ReactViewer>> = (props) => {
  return (
    <React.Suspense>
      <ReactViewer {...props} />
    </React.Suspense>
  );
};

export default Viewer;
