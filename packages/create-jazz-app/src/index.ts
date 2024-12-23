#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import chalk from "chalk";
import { Command } from "commander";
import degit from "degit";
import gradient from "gradient-string";
import inquirer from "inquirer";
import ora from "ora";

import { type FrameworkAuthPair, frameworkToAuthExamples } from "./config.js";

const program = new Command();

const jazzGradient = gradient(["#FF4D4D", "#FF9900", "#FFD700"]);

type ScaffoldOptions = {
  starter: FrameworkAuthPair;
  projectName: string;
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "deno";
};

async function scaffoldProject({
  starter,
  projectName,
  packageManager,
}: ScaffoldOptions): Promise<void> {
  console.log("\n" + jazzGradient.multiline("Jazz App Creator\n"));

  const starterConfig = frameworkToAuthExamples[starter];
  if (!starterConfig) {
    throw new Error(`Invalid starter: ${starter}`);
  }

  const devCommand = starter === "react-native-expo-clerk-auth" ? "ios" : "dev";

  if (!starterConfig.repo) {
    throw new Error(
      `Starter template ${starterConfig.name} is not yet implemented`,
    );
  }

  // Step 2: Clone starter
  const cloneSpinner = ora({
    text: chalk.blue(`Cloning starter: ${chalk.bold(starterConfig.name)}`),
    spinner: "dots",
  }).start();

  try {
    const emitter = degit(starterConfig.repo, {
      cache: false,
      force: true,
      verbose: true,
    });
    await emitter.clone(projectName);
    cloneSpinner.succeed(chalk.green("Template cloned successfully"));
  } catch (error) {
    cloneSpinner.fail(chalk.red("Failed to clone template"));
    throw error;
  }

  // Step 3: Fixing dependencies
  const depsSpinner = ora({
    text: chalk.blue("Updating dependencies..."),
    spinner: "dots",
  }).start();

  try {
    const packageJsonPath = `${projectName}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Replace workspace: dependencies with latest
    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([pkg, version]) => {
        if (typeof version === "string" && version.includes("workspace:")) {
          packageJson.dependencies[pkg] = "latest";
        }
      });
    }

    packageJson.name = projectName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    depsSpinner.succeed(chalk.green("Dependencies updated"));
  } catch (error) {
    depsSpinner.fail(chalk.red("Failed to update dependencies"));
    throw error;
  }

  // Step 4: Install dependencies
  const installSpinner = ora({
    text: chalk.blue(
      `Installing dependencies with ${chalk.bold(packageManager)}...`,
    ),
    spinner: "dots",
  }).start();

  try {
    execSync(`cd ${projectName} && ${packageManager} install`, {
      stdio: "pipe",
    });
    installSpinner.succeed(chalk.green("Dependencies installed"));
  } catch (error) {
    installSpinner.fail(chalk.red("Failed to install dependencies"));
    throw error;
  }

  // Additional setup for React Native
  if (starter === "react-native-expo-clerk-auth") {
    const rnSpinner = ora({
      text: chalk.blue("Setting up React Native project..."),
      spinner: "dots",
    }).start();

    try {
      execSync(`cd ${projectName} && npx expo prebuild`, { stdio: "pipe" });
      execSync(`cd ${projectName} && npx pod-install`, { stdio: "pipe" });

      // Update metro.config.js
      const metroConfigPath = `${projectName}/metro.config.js`;
      const metroConfig = `
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });
`;
      fs.writeFileSync(metroConfigPath, metroConfig);

      rnSpinner.succeed(chalk.green("React Native setup completed"));
    } catch (error) {
      rnSpinner.fail(chalk.red("Failed to setup React Native"));
      throw error;
    }
  }

  // Final success message
  console.log("\n" + chalk.green.bold("✨ Project setup completed! ✨\n"));
  console.log(chalk.cyan("To get started:"));
  console.log(chalk.white(`  cd ${chalk.bold(projectName)}`));
  console.log(
    chalk.white(`  ${chalk.bold(`${packageManager} run ${devCommand}`)}\n`),
  );
}

async function promptUser(): Promise<ScaffoldOptions> {
  console.log("\n" + jazzGradient.multiline("Jazz App Creator\n"));
  console.log(chalk.blue.bold("Let's create your Jazz app! 🎷\n"));

  const answers = (await inquirer.prompt([
    {
      type: "list",
      name: "starter",
      message: chalk.cyan("Choose a starter:"),
      choices: Object.entries(frameworkToAuthExamples)
        .filter(([_, value]) => value.repo) // Only show implemented starters
        .map(([key, value]) => ({
          name: chalk.white(value.name),
          value: key,
        })),
    },
    {
      type: "list",
      name: "packageManager",
      message: chalk.cyan("Choose a package manager:"),
      choices: [
        { name: chalk.white("npm"), value: "npm" },
        { name: chalk.white("yarn"), value: "yarn" },
        { name: chalk.white("pnpm"), value: "pnpm" },
        { name: chalk.white("bun"), value: "bun" },
        { name: chalk.white("deno"), value: "deno" },
      ],
      default: "npm",
    },
    {
      type: "input",
      name: "projectName",
      message: chalk.cyan("Enter your project name:"),
      validate: (input: string) =>
        input ? true : chalk.red("Project name cannot be empty"),
    },
  ])) as ScaffoldOptions;

  return answers;
}

function validateOptions(
  options: Partial<ScaffoldOptions>,
): options is ScaffoldOptions {
  const errors: string[] = [];

  if (!options.starter) {
    errors.push("Starter template is required");
  }
  if (!options.projectName) {
    errors.push("Project name is required");
  }
  if (!options.packageManager) {
    errors.push("Package manager is required");
  }

  if (options.starter && !frameworkToAuthExamples[options.starter]) {
    errors.push(`Invalid starter template: ${options.starter}`);
  }

  if (
    options.packageManager &&
    !["npm", "yarn", "pnpm", "bun", "deno"].includes(options.packageManager)
  ) {
    errors.push(`Invalid package manager: ${options.packageManager}`);
  }

  if (errors.length > 0) {
    throw new Error(chalk.red(errors.join("\n")));
  }

  return true;
}

program
  .description(chalk.blue("CLI to generate Jazz starter projects"))
  .option("-s, --starter <starter>", chalk.cyan("Starter template to use"))
  .option("-n, --project-name <name>", chalk.cyan("Name of the project"))
  .option(
    "-p, --package-manager <manager>",
    chalk.cyan("Package manager to use (npm, yarn, pnpm, bun, deno)"),
  )
  .action(async (options) => {
    try {
      // If all required options are provided, use them directly
      if (options.starter && options.projectName && options.packageManager) {
        const nonInteractiveOptions = {
          starter: options.starter as FrameworkAuthPair,
          projectName: options.projectName,
          packageManager:
            options.packageManager as ScaffoldOptions["packageManager"],
        };

        // Validate will throw if invalid
        validateOptions(nonInteractiveOptions);
        await scaffoldProject(nonInteractiveOptions);
      } else {
        // Otherwise, fall back to interactive mode
        const scaffoldOptions = await promptUser();
        await scaffoldProject(scaffoldOptions);
      }
    } catch (error: any) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        console.log(chalk.yellow("\n👋 Until next time!\n"));
      } else {
        console.error(chalk.red("\n❌ Error:"), error.message, "\n");
        process.exit(1);
      }
    }
  });

// Add help text to show available starters
program.on("--help", () => {
  console.log("\n" + jazzGradient.multiline("Available starters:\n"));
  Object.entries(frameworkToAuthExamples).forEach(([key, value]) => {
    if (value.repo) {
      // Only show implemented starters
      console.log(
        chalk.cyan(`  ${key}`),
        chalk.white("-"),
        chalk.white(value.name),
      );
    }
  });
  console.log(chalk.blue("\nExample usage:"));
  console.log(
    chalk.white(
      "  create-jazz-app --starter react-demo-auth --project-name my-app --package-manager npm\n",
    ),
  );
});

program.parse(process.argv);
