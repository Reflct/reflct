import { Viewer } from "@reflct/next";

const sceneId = process.env.REFLCT_SCENE_ID;
const apikey = process.env.REFLCT_API_KEY;

export default function Home() {
  if (!sceneId || !apikey) {
    return <div>Please provide sceneId and/or apikey</div>;
  }

  return (
    <div className="w-full h-full">
      <Viewer id={sceneId} apikey={apikey} />
    </div>
  );
}
