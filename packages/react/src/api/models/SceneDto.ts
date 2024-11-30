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
  maxAzimuthAngle: z.number(),
  minAzimuthAngle: z.number(),
  maxPolarAngle: z.number(),
  minPolarAngle: z.number(),
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

export const transitionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["point"]),
  title: z.string(),
  description: z.string().optional(),
  metadata: z
    .record(
      z.string(),
      z.object({ value: z.string(), updatedAt: isoDateSchema })
    )
    .optional(),
  duration: z.number(),
  easing: z.string(),
  item: perspectiveCameraDataSchema,
});
export type Transition = z.infer<typeof transitionSchema>;

export const transitionGroupSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  metadata: z
    .record(
      z.string(),
      z.object({ value: z.string(), updatedAt: isoDateSchema })
    )
    .optional(),
  transitions: z.array(transitionSchema),
});

export type TransitionGroup = z.infer<typeof transitionGroupSchema>;

export const sceneDataSchema = z.object({
  camera: perspectiveCameraDataSchema,
  items: z.array(mantelItemSchema),
  transitionGroups: z.array(transitionGroupSchema),
});

export type SceneDataDto = z.infer<typeof sceneDataSchema>;

export const sceneMetadataSchema = z.record(
  z.string(),
  z.object({ value: z.string(), updatedAt: isoDateSchema })
);
export type SceneMetadata = z.infer<typeof sceneMetadataSchema>;

export const sceneSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  metadata: z
    .record(
      z.string(),
      z.object({ value: z.string(), updatedAt: isoDateSchema })
    )
    .optional(),
  tags: z.array(z.string()),
  data: sceneDataSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  publishedAt: isoDateSchema.optional(),
});

export type SceneDto = z.infer<typeof sceneSchema>;
