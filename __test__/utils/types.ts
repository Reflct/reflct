export type Environment = "development" | "staging" | "production";

export interface BuildConfig {
  rootDir: string;
  tmpDir: string;
  envDir: string;
  envFile: string;
}
