import { z } from "zod";

export const builderInputOptionsSchema = z.object({
  projectName: z.string(),
  framework: z.string(),
  appPath: z.string(),
  appName: z.string(),
});

export type BuilderInputOptions = z.infer<typeof builderInputOptionsSchema>;

export function validateBuilderInputOptions(options: Record<string, string>) {
  return builderInputOptionsSchema.parse(options);
}
