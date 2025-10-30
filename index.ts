// index.ts

import * as dotenv from "dotenv";
import inquirer from "inquirer";
import { runOnboardingAgent } from "./src/OnboardingAgent";
import chalk from "chalk";

// Load environment variables from .env file
dotenv.config();

const showBanner = () => {
  console.log(chalk.bold.yellow("========================================"));
  console.log(chalk.bold.yellow(" Welcome GitHub Onboarding Video Agent✨"));
  console.log(chalk.bold.yellow("========================================"));
  console.log("\n");
};

async function main() {
  showBanner();

  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "What is your name?",
        validate: (input: string) =>
          input.trim() !== "" || "Name cannot be empty.",
      },
      {
        type: "input",
        name: "githubUrl",
        message: "Enter the GitHub repository URL:",
        validate: (input: string) => {
          // Simple regex to check for a valid GitHub URL format
          const githubUrlRegex =
            /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w-.]+$/;
          return (
            githubUrlRegex.test(input) ||
            "Please enter a valid GitHub repository URL."
          );
        },
      },
    ]);

    const { name, githubUrl } = answers;
    console.log(
      `\n👍 Great! Starting the onboarding process for ${name} with the repo: ${githubUrl}\n`
    );

    // Start the agent logic
    await runOnboardingAgent(name, githubUrl);
  } catch (error) {
    console.error(
      "❌ An error occurred during the interactive session:",
      error
    );
  }
}

main();
