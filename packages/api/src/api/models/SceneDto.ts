import { z } from "zod";

export const ISO_DATETIME_REGEX =
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/;

const isoDateSchema = z
  .string()
  .regex(ISO_DATETIME_REGEX, "date must be a valid ISO date");

const vector3TupleSchema = z.tuple([z.number(), z.number(), z.number()]);
const vector4TupleSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const objectDataSchema = z.object({
  id: z.string().uuid(),
  position: vector3TupleSchema,
  rotation: vector4TupleSchema,
  scale: vector3TupleSchema,
  visible: z.boolean().optional(),
});

export type ObjectData = z.infer<typeof objectDataSchema>;

const splatDataSchema = objectDataSchema.extend({
  type: z.literal("splat"),
  src: z.string(),
});

export type SplatData = z.infer<typeof splatDataSchema>;

const gs3dDataSchema = objectDataSchema.extend({
  type: z.literal("gs3d"),
  src: z.string(),
  antialiased: z.boolean().optional(),
});

export type GS3dData = z.infer<typeof gs3dDataSchema>;

const cameraDataSchema = z.object({
  id: z.string().uuid(),
  position: vector3TupleSchema,
  lookAt: vector3TupleSchema,
  zoom: z.number(),
  debug: z.boolean().optional(),
});

export type CameraData = z.infer<typeof cameraDataSchema>;

const perspectiveCameraDataSchema = cameraDataSchema.extend({
  type: z.literal("perspectiveCamera"),
  fov: z.number(),
  aspect: z.number(),
  near: z.number(),
  far: z.number(),
  maxAzimuthAngle: z.union([z.number(), z.null()]),
  minAzimuthAngle: z.union([z.number(), z.null()]),
  maxPolarAngle: z.union([z.number(), z.null()]),
  minPolarAngle: z.union([z.number(), z.null()]),
});

export type PerspectiveCameraData = z.infer<typeof perspectiveCameraDataSchema>;

const orthographicCameraDataSchema = cameraDataSchema.extend({
  type: z.literal("orthographicCamera"),
  left: z.number(),
  right: z.number(),
  top: z.number(),
  bottom: z.number(),
  near: z.number(),
  far: z.number(),
});
export type OrthographicCameraData = z.infer<
  typeof orthographicCameraDataSchema
>;

export const mantelItemSchema = z.union([gs3dDataSchema, splatDataSchema]);
export type MantelItem = z.infer<typeof mantelItemSchema>;

export const sceneMetadataSchema = z.record(
  z.string(),
  z.object({ value: z.string(), updatedAt: isoDateSchema })
);
export type SceneMetadata = z.infer<typeof sceneMetadataSchema>;

export const transitionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["point"]),
  title: z.string(),
  description: z.string().optional(),
  showHitPoint: z.boolean().optional(),
  showTextDetails: z.boolean().optional(),
  metadata: sceneMetadataSchema.optional(),
  duration: z.number(),
  easing: z.string(),
  item: perspectiveCameraDataSchema,
});
export type Transition = z.infer<typeof transitionSchema>;

export const transitionGroupSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  metadata: sceneMetadataSchema.optional(),
  transitions: z.array(transitionSchema),
});

export type TransitionGroup = z.infer<typeof transitionGroupSchema>;

export const sceneDataSchema = z.object({
  camera: perspectiveCameraDataSchema,
  items: z.array(mantelItemSchema),
  transitionGroups: z.array(transitionGroupSchema),
});

export const linkedSceneSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type LinkedScene = z.infer<typeof linkedSceneSchema>;

export type SceneDataDto = z.infer<typeof sceneDataSchema>;

export const sceneSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  metadata: sceneMetadataSchema.optional(),
  tags: z.array(z.string()),
  data: sceneDataSchema,
  backgroundColor: z.string(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  publishedAt: isoDateSchema.optional(),
  summaryImage: z.string().optional(),
  linkedScenes: z.array(linkedSceneSchema),
});

export type SceneDto = z.infer<typeof sceneSchema>;
