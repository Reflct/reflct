import { setupNextJsV14, setupNextJsV15 } from "./utils/setup-nextjs.js";
import { setupViteV5, setupViteV6 } from "./utils/setup-vite.js";
import { setupTestEnvironment } from "./utils/test-helpers.js";

const environments = ["development", "staging", "production"] as const;
type Environment = (typeof environments)[number];

// Validate environment argument
const envArg = process.argv[2];
if (!envArg || !environments.includes(envArg as Environment)) {
  console.error(
    `Error: Invalid environment. Must be one of: ${environments.join(", ")}`
  );
  process.exit(1);
}

const environment = envArg as Environment;

try {
  const paths = await setupTestEnvironment(environment);

  console.log("paths:");
  console.log(paths);

  await setupViteV5(paths);
  await setupViteV6(paths);
  await setupNextJsV14(paths);
  await setupNextJsV15(paths);
  console.log(`Successfully set up test environment for: ${environment}`);
} catch (error) {
  console.error("Error setting up test environment:", error);
  process.exit(1);
}
