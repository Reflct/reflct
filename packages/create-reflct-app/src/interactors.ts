import chalk from "chalk";
import { defaultValues, getGlobalInstallCommand } from "./settings";
import prompts, { type InitialReturnValue } from "prompts";
import validatePackageName from "validate-npm-package-name";
import { basename, resolve } from "node:path";

import packageJson from "../package.json";
import CommandError from "./errors/command";

type Framework = "nextjs" | "hydrogen";

const onPromptState = (state: {
  value: InitialReturnValue;
  aborted: boolean;
  exited: boolean;
}) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write("\x1B[?25h");
    process.stdout.write("\n");
    process.exit(1);
  }
};

const Interactors = {
  printWelcome() {
    console.log(chalk.green("Running create-reflct-app"));
  },
  async askProjectName() {
    const res = await prompts({
      onState: onPromptState,
      type: "text",
      name: "projectName",
      message: "What is your project name?",
      initial: defaultValues.projectName,
      validate: (value) => {
        const result = validatePackageName(basename(resolve(value)));

        if (!result.validForNewPackages) {
          return `Invalid project name: ${result.errors?.at(0)}`;
        }

        return true;
      },
    });

    if (typeof res.projectName === "string") {
      return res.projectName.trim();
    }

    return defaultValues.projectName;
  },
  async askFramework(): Promise<Framework> {
    const options: { title: string; value: Framework }[] = [
      { title: "nextjs", value: "nextjs" },
      // { title: "hydrogen", value: "hydrogen" },
    ];

    const res = await prompts({
      onState: onPromptState,
      type: "select",
      name: "framework",
      message: "What is your framework?",
      choices: options,
    });

    return (
      options.find((option) => option.value === res.framework)?.value ||
      options[0].value
    );
  },
  printCreatingDirectory(path: string) {
    console.log();
    console.log(chalk.green(`Creating a new reflct app in ${path}`));
    console.log();
  },
  printSuccess(path: string) {
    console.log(chalk.green("Project created successfully."));
    console.log(chalk.cyan("You can begin by typing:"));
    console.log(chalk.cyan("  cd " + path));
    console.log(chalk.cyan("  yarn dev"));
  },
  printUpdateNotification() {
    console.log(
      chalk.yellow(`A new version of \`${packageJson.name}\` is available!`)
    );
    console.log(
      chalk.green(
        `Run ${chalk.cyan(getGlobalInstallCommand(packageJson.name))} to update.`
      )
    );
  },
  printExit(error: CommandError) {
    console.log();
    console.log("Aborting installation.");
    if (error.command) {
      console.log(
        chalk.red(
          `  ${chalk.cyan(error.command)} has failed.\n  ${error.message}`
        )
      );
    } else {
      console.log(
        chalk.red("Unexpected error. Please report it as a bug:") + "\n",
        error
      );
    }
    console.log();
  },
};

export default Interactors;
