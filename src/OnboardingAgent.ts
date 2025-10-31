// src/OnboardingAgent.ts
import { Agent, hostedMcpTool, run } from "@openai/agents";
import {
  composio,
  connectHeygenAccount,
  createSingleToolkitSession,
} from "./composio";
import { getConnectionConfig } from "./connection";

// A unique static ID for this agent's user
const USER_ID = "onboarding-agent-user";

/**
 * Helper function to introduce a delay for polling.
 * @param ms - Milliseconds to wait.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * STAGE 1: Analyze GitHub repo and generate a video script.
 */
async function getScriptFromGitHub(githubUrl: string): Promise<string> {
  console.log("\n--- STAGE 1: ANALYZING GITHUB REPO ---");
  const { githubAuthConfigId } = getConnectionConfig();
  const session = await createSingleToolkitSession(
    USER_ID,
    "github",
    githubAuthConfigId
  );

  const githubAgent = new Agent({
    name: "GitHub Analysis Assistant",
    instructions:
      "You are an expert AI assistant that analyzes a GitHub repository and generates a video script. Your final output must be ONLY the script text, nothing else.",
    tools: [
      hostedMcpTool({ serverLabel: "tool_router", serverUrl: session.url }),
    ],
    model: "gpt-4o",
  });

  const prompt = `
    Analyze the GitHub repository at ${githubUrl}, focusing on its README, file structure, and purpose.
    Based on your analysis, act as a creative scriptwriter. Create a concise, engaging, 30-second video script for a human talking that feels conversational and casual.
    Your final response MUST be only the voiceover text, without any titles, labels like 'SCRIPT:', or formatting.
  `;

  console.log("✍️  Generating video script...");
  const result = await run(githubAgent, prompt);
  const script = result.finalOutput;

  if (!script) {
    throw new Error("Failed to generate a script from the GitHub analysis.");
  }
  console.log("✅ Script generated successfully!");
  return script;
}

/**
 * STAGE 2: Create a video using Heygen's proxy execute.
 */
async function createVideoWithHeygen(script: string): Promise<string> {
  console.log("\n--- STAGE 2: CREATING HEYGEN VIDEO ---");
  const { heygenAuthConfigId, heygenApiKey } = getConnectionConfig();
  const connectedAccountId = await connectHeygenAccount(
    USER_ID,
    heygenAuthConfigId,
    heygenApiKey
  );

  const videoPayload = {
    test: false,
    dimension: { width: 1280, height: 720 },
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: "Georgia_sitting_office_front",
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: script,
          voice_id: "bb7b00990ce0483ab1e6bd1122ec658f",
        },
        background: {
          type: "color",
          value: "#FFFFFF",
        },
      },
    ],
  };

  console.log("▶️  Requesting video generation from HeyGen...");
  const generateResponse = await composio.tools.proxyExecute({
    connectedAccountId,
    method: "POST",
    endpoint: "/v2/video/generate",
    body: videoPayload,
  });

  const videoId = (generateResponse.data as any)?.data?.video_id;
  if (!videoId) {
    throw new Error(
      "Failed to get a video ID from HeyGen. Response: " +
        JSON.stringify(generateResponse.data, null, 2)
    );
  }
  console.log(`✅ Video generation started! Video ID: ${videoId}`);

  console.log(
    "⏳ Waiting for video to be ready (this can take a few minutes)..."
  );
  while (true) {
    const statusResponse = await composio.tools.proxyExecute({
      connectedAccountId,
      method: "GET",
      endpoint: "/v1/video_status.get",
      parameters: [{ name: "video_id", value: videoId, in: "query" }],
    });

    const statusData = (statusResponse.data as any)?.data;
    const videoStatus = statusData?.status;
    console.log(`   Current video status: ${videoStatus || "unknown"}`);

    if (videoStatus === "completed") {
      console.log("🎉 Video is ready!");
      return statusData.video_url;
    } else if (videoStatus === "failed") {
      throw new Error(
        `Video generation failed. Details: ${JSON.stringify(statusData.error)}`
      );
    }
    await delay(15000); // Wait 15 seconds before polling again
  }
}

/**
 * STAGE 3: Notify the team on Slack.
 */
async function notifySlack(name: string, videoUrl: string): Promise<string> {
  console.log("\n--- STAGE 3: NOTIFYING SLACK ---");
  const { slackAuthConfigId, slackChannelId } = getConnectionConfig();
  const session = await createSingleToolkitSession(
    USER_ID,
    "slack",
    slackAuthConfigId
  );

  const slackAgent = new Agent({
    name: "Slack Notification Assistant",
    instructions:
      "You are an AI assistant that posts a message to a Slack channel.",
    tools: [
      hostedMcpTool({ serverLabel: "tool_router", serverUrl: session.url }),
    ],
    model: "gpt-4o-mini",
  });

  const prompt = `
    Post a message to the Slack channel with ID "${slackChannelId}".
    The message should be exactly: "${name} is onboarded ✨ ${videoUrl}"
  `;

  console.log("💬 Sending notification to Slack...");
  const result = await run(slackAgent, prompt);
  console.log("✅ Notification sent successfully!");
  return result.finalOutput || "Notification sent.";
}

/**
 * Runs the main onboarding agent logic by orchestrating the three stages.
 */
export async function runOnboardingAgent(name: string, githubUrl: string) {
  try {
    const script = await getScriptFromGitHub(githubUrl);
    const videoUrl = await createVideoWithHeygen(script);
    const finalMessage = await notifySlack(name, videoUrl);

    console.log("\n-----------------------------------------");
    console.log("✅ Onboarding workflow complete!");
    console.log(`[FINAL MESSAGE] ${finalMessage}`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("\n❌ A critical error occurred in the agent:", error);
    process.exit(1);
  }
}
