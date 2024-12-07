import { API_BASE_URL } from "../config/api";
import { SceneDto } from "./models";

export const client = {
  getScene: async (sceneId: string, apikey: string): Promise<SceneDto> => {
    const response = await fetch(
      `${API_BASE_URL}/api/scenes/public/${sceneId}`,
      {
        headers: {
          Authorization: `apikey ${apikey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch scene");
    }

    return response.json();
  },
  getPreviewScene: async (
    sceneId: string,
    apikey: string
  ): Promise<SceneDto> => {
    const response = await fetch(
      `${API_BASE_URL}/api/scenes/preview/${sceneId}`,
      {
        headers: {
          Authorization: `apikey ${apikey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch preview scene");
    }

    return response.json();
  },
};
