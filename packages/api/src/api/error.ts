type ErrorType =
  | "scene_not_found"
  | "invalid_apikey"
  | "invalid_scene_id"
  | "internal_server_error"
  | "payment_required";

export class ReflctApiError extends Error {
  type: ErrorType;

  constructor(type: ErrorType, message: string) {
    super(message);
    this.type = type;
    this.name = "ReflctApiError";
  }
}
