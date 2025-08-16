import { API_BASE_URL } from "../config/api";
import { ReflctApiError } from "./error";
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
      if (response.status === 404) {
        throw new ReflctApiError(
          "scene_not_found",
          "Scene could not be found."
        );
      }

      if (response.status === 403) {
        throw new ReflctApiError(
          "integration_not_allowed",
          "Integration is not allowed for this tier"
        );
      }

      if (response.status === 402) {
        throw new ReflctApiError(
          "integration_not_enabled",
          "Scene integration needs to be enabled to be accessed."
        );
      }

      if (response.status === 401) {
        throw new ReflctApiError(
          "invalid_apikey",
          "The provided API key is invalid."
        );
      }

      if (response.status === 400) {
        throw new ReflctApiError(
          "invalid_scene_id",
          "The provided scene ID is not in the correct format"
        );
      }

      throw new ReflctApiError(
        "internal_server_error",
        "There was an error when fetching the content"
      );
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
      if (response.status === 404) {
        throw new ReflctApiError(
          "scene_not_found",
          "The requested preview scene could not be found."
        );
      }

      if (response.status === 403) {
        throw new ReflctApiError(
          "integration_not_allowed",
          "Integration is not allowed for this tier"
        );
      }

      if (response.status === 402) {
        throw new ReflctApiError(
          "integration_not_enabled",
          "Scene integration needs to be enabled to be accessed."
        );
      }

      if (response.status === 401) {
        throw new ReflctApiError(
          "invalid_apikey",
          "API key is invalid or has expired."
        );
      }

      if (response.status === 400) {
        throw new ReflctApiError(
          "invalid_scene_id",
          "The provided scene ID is not in the correct format"
        );
      }

      throw new ReflctApiError(
        "internal_server_error",
        "There was an error when fetching the content"
      );
    }

    return response.json();
  },
};
