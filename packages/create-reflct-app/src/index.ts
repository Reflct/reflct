#!/usr/bin/env node

import { Command } from "commander";
import { basename, resolve } from "node:path";
import packageJson from "../package.json";
import Builder from "./builder";
import Interactors from "./interactors";
import { validateBuilderInputOptions } from "./builder/schema";
import CommandError from "./errors/command";

const program = new Command(packageJson.name)
  .version(
    packageJson.version,
    "-v, --version",
    "Show the current version of create-reflct-app"
  )
  .argument("[project-name]", "The name of the project to create")
  .usage("[project-name] [options]")
  .helpOption("-h, --help", "Show help for create-reflct-app")
  .option("-f, --framework <framework>", "Example Template")
  .parse(process.argv);

const opts = program.opts();
const args = program.args;

async function run() {
  Interactors.printWelcome();

  const options: Record<string, string> = {
    projectName: args[0],
    ...opts,
  };

  if (!options.projectName) {
    options.projectName = await Interactors.askProjectName();
  }

  if (!options.framework) {
    options.framework = await Interactors.askFramework();
  }

  options.appPath = resolve(options.projectName);
  options.appName = basename(options.appPath);

  await Builder.buildNextApp(validateBuilderInputOptions(options));
}

async function notifyUpdate() {
  // TODO: Check for update
  const latest = true;

  if (!latest) {
    Interactors.printUpdateNotification();
  }
}

async function exit(error: CommandError) {
  Interactors.printExit(error);

  process.exit(1);
}

run().then(notifyUpdate).catch(exit);
