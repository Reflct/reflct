import { spawn } from "cross-spawn";
import glob from "fast-glob";
import { existsSync, readdirSync } from "node:fs";
import fs, { copyFile, mkdir } from "node:fs/promises";
import os from "os";
import path, { dirname } from "path";
import CommandError from "../errors/command";
import Interactors from "../interactors";
import { BuilderInputOptions } from "./schema";

export async function buildNextApp({
  projectName,
  framework,
  appPath,
  appName,
}: BuilderInputOptions) {
  let currentDir = process.cwd();

  const files = existsSync(appPath) && readdirSync(appPath);
  if (files && files.length > 0) {
    throw new CommandError(
      `Directory ${appPath} already exists`,
      "Create Directory"
    );
  }

  const relativeAppPath = path.relative(currentDir, appPath);

  Interactors.printCreatingDirectory(relativeAppPath);
  await mkdir(appPath, { recursive: true });

  process.chdir(appPath);
  currentDir = process.cwd();

  const packageFiles = await glob.async(["**/package.json"], {
    cwd: path.join(__dirname, "..", "templates", framework),
    absolute: true,
    dot: true,
    stats: false,
  });

  const packageFilePath = packageFiles.at(0);

  if (!packageFilePath) {
    throw new CommandError(
      "Cannot find package.json in the template",
      "Create Package"
    );
  }

  const packageFile = await fs.readFile(packageFilePath, "utf-8");

  const packageJson = JSON.parse(packageFile);

  const templateFiles = await glob.async(
    [
      "**/*",
      "!node_modules",
      "!dist",
      "!.next",
      "!.env",
      "!certificates",
      "!yarn*",
      "!package.json",
    ],
    {
      cwd: path.join(__dirname, "..", "templates", framework),
      absolute: false,
      dot: true,
      stats: false,
    }
  );

  const rename = (file: string) => {
    if (file === "README-template.md") {
      return "README.md";
    } else if (file === ".gitignore-template") {
      return ".gitignore";
    } else if (file === ".env.example") {
      return ".env";
    }

    return file;
  };

  templateFiles.forEach(async (file) => {
    const templateFilePath = path.join(
      __dirname,
      "..",
      "templates",
      framework,
      file
    );
    const outputFilePath = path.join(currentDir, rename(file));

    await mkdir(dirname(outputFilePath), { recursive: true });
    await copyFile(templateFilePath, outputFilePath);
  });

  packageJson.name = appName;
  await fs.writeFile(
    path.join(appPath, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  await spawn("yarn", {
    stdio: "inherit",
  });

  Interactors.printSuccess(appName);
}
