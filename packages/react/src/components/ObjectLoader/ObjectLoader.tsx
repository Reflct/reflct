import React from "react";
import { MantelItem } from "../../api/models";
import { useCanvasContext } from "../../context";
import GS3dItem from "../items/GS3dItem";
import PerspectiveCameraItem from "../Camera/PerspectiveCameraItem";

type Props = MantelItem;

const Item: React.FC<Props> = (props) => {
  switch (props.type) {
    case "gs3d":
      return <GS3dItem {...props} />;
    // case "splat":
    default:
      console.error("Invalid item type: ", props.type);

      return null;
  }
};

const ObjectLoader = () => {
  const { items } = useCanvasContext();

  return (
    <>
      {items.map((item) => {
        return <Item key={item.id} {...item} />;
      })}
    </>
  );
};

export default ObjectLoader;
