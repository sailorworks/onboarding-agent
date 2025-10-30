// src/OnboardingAgent.ts

import { Agent, hostedMcpTool, run } from "@openai/agents"; // Use 'run' from here
import { createToolRouterSession } from "./composio";
import { getConnectionConfig } from "./connection";

/**
 * Runs the main onboarding agent logic.
 * @param name - The name of the person being onboarded.
 * @param githubUrl - The URL of the GitHub repository.
 */
export async function runOnboardingAgent(name: string, githubUrl: string) {
  try {
    // 1. Get connection configuration from .env
    const connectionConfig = getConnectionConfig();
    const { slackChannelId } = connectionConfig;

    // A unique ID for this user's session
    const userId = `onboarding-agent-user-${Date.now()}`;

    // 2. Create a Tool Router session with pre-configured connections
    const session = await createToolRouterSession(userId, connectionConfig);

    // 3. Define the AI agent with access to the Tool Router
    const agent = new Agent({
      name: "GitHub Onboarding Assistant",
      instructions:
        "You are an expert AI assistant that automates new team member onboarding by analyzing a GitHub repo, creating a video summary, and notifying the team on Slack.",
      tools: [
        hostedMcpTool({
          serverLabel: "tool_router",
          serverUrl: session.url,
        }),
      ],
      model: "gpt-4o",
    });

    // 4. Construct the detailed, single-shot master prompt
    const masterPrompt = `
      Analyze the GitHub repository at ${githubUrl}, focusing on its README, file structure, and last two commits. If the repository is private or inaccessible, stop and inform the user that you cannot access it.

      Next, act as a creative scriptwriter for a video tutorial. Create a concise, engaging, 30-second video script for a human talking that feels conversational and casual. The output for this part must be only the voiceover text, without any titles, labels like 'SCRIPT:', or formatting.

      Then, use the generated voiceover to create a 30-second horizontal video using Heygen. The avatar ID is "Georgia_sitting_office_front" and the voice ID is "bb7b00990ce0483ab1e6bd1122ec658f". Wait for the video generation to complete.

      Finally, post a message to the Slack channel ID "${slackChannelId}" announcing that '${name}' is onboarded, and include the link to the new video. The message should be: "${name} is onboarded ✨" followed by the video URL.
    `;
    // ... inside runOnboardingAgent function

    console.log(
      "🚀 Executing the onboarding workflow. This may take a moment..."
    );
    console.log("---");

    // 5. Execute the agent and get the final result directly
    const result = await run(agent, masterPrompt);

    // 6. The 'run' function handles all intermediate steps internally.
    // We can now directly access the final output.

    if (result.finalOutput) {
      console.log("---");
      console.log("✅ Onboarding workflow complete!");
      console.log(`[FINAL MESSAGE] ${result.finalOutput}`);
    } else {
      console.log("---");
      console.log("🏁 Agent finished without a final message.");
      console.log("Full result:", result); // Log the full result for debugging
    }
  } catch (error) {
    console.error("❌ A critical error occurred in the agent:", error);
    process.exit(1);
  }
}
