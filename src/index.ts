// src/index.ts

import { Composio } from "@composio/core";
import { AuthScheme } from "@composio/core";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

// Load environment variables from .env file
dotenv.config();

// --- CONFIGURATION ---
const HEYGEN_AUTH_CONFIG_ID = "ac_Kfc8NRJZakvm"; // Your actual Auth Config ID
const USER_ID = "ca_KZZhu6MyRs8t"; // A unique static ID for this agent's user

// --- INITIALIZE CLIENTS ---
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * A helper function to introduce a delay.
 * @param ms - The number of milliseconds to wait.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Main function to run the agent.
 */
// src/index.ts

// ... (keep all the imports and client initializations as they are)

/**
 * Main function to run the agent.
 */
async function main() {
  console.log("🤖 Starting the AI Video Agent...");

  const rl = readline.createInterface({ input, output });
  const topic = await rl.question("🎬 What topic should the video be about? ");
  rl.close();

  if (!topic) {
    console.error("Topic cannot be empty. Exiting.");
    return;
  }
  console.log(`👍 Topic received: "${topic}"`);

  try {
    // Connect HeyGen account
    console.log("🔄 Connecting to HeyGen via Composio...");
    const connection = await composio.connectedAccounts.initiate(
      USER_ID,
      HEYGEN_AUTH_CONFIG_ID,
      {
        config: AuthScheme.APIKey({
          generic_api_key: process.env.HEYGEN_API_KEY!,
        }),
        allowMultiple: true,
      }
    );
    const connectedAccountId = connection.id;
    console.log("✅ HeyGen account connected successfully.");

    // Generate script with OpenAI
    console.log("✍️ Generating a video script with OpenAI...");
    const scriptCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a creative scriptwriter. You create concise, engaging, 30-second video scripts for a human talking it should feel conversational and casual. You'll only give the voiceover part of the script. The output must be plain text, without any titles, labels like 'SCRIPT:', or formatting.",
        },
        {
          role: "user",
          content: `Create a 30-second horizontal video script about: ${topic}`,
        },
      ],
      max_tokens: 200,
    });
    const script = scriptCompletion.choices[0].message.content;
    if (!script) {
      throw new Error("Failed to generate a script.");
    }
    console.log("📄 Script generated:\n---");
    console.log(script);
    console.log("---");

    // Hardcode the avatar and voice IDs
    const avatarId = "Georgia_sitting_office_front";
    const voiceId = "bb7b00990ce0483ab1e6bd1122ec658f";

    console.log("✅ Using pre-selected IDs:");
    console.log(`   Avatar ID: ${avatarId}`);
    console.log(`   Voice ID: ${voiceId}`);

    // Request video generation via proxy
    console.log("▶️  Requesting video generation from HeyGen via proxy...");
    const generateResponse = await composio.tools.proxyExecute({
      connectedAccountId: connectedAccountId,
      method: "POST",
      endpoint: "/v2/video/generate",
      body: {
        title: `AI Video on ${topic}`,
        test: true,
        dimension: {
          width: 1280,
          height: 720,
        },
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: avatarId,
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: script,
              voice_id: voiceId,
            },
            background: {
              type: "color",
              value: "#FFFFFF",
            },
          },
        ],
      },
    });

    const responseData = (generateResponse.data as any)?.data;
    const videoId = responseData?.video_id;

    if (!videoId) {
      throw new Error(
        "Failed to get a video ID from HeyGen. Response: " +
          JSON.stringify(generateResponse, null, 2)
      );
    }
    console.log(`✅ Video generation started! Video ID: ${videoId}`);

    // --- START OF CORRECTED CODE ---
    // Poll for status using the correct endpoint and response parsing
    console.log(
      "⏳ Waiting for video to be ready (this can take a few minutes)..."
    );
    let videoUrl = null;
    while (true) {
      const statusResponse = await composio.tools.proxyExecute({
        connectedAccountId: connectedAccountId,
        method: "GET",
        endpoint: "/v1/video_status.get",
        // FIX: Use the 'parameters' array for query params
        parameters: [
          {
            name: "video_id",
            value: videoId,
            in: "query",
          },
        ],
      });

      // Access the nested 'data' object from the response
      const statusData = (statusResponse.data as any)?.data;
      const videoStatus = statusData?.status;

      console.log(
        `   Current video status: ${videoStatus || "Checking status..."}`
      );

      if (videoStatus === "completed") {
        videoUrl = statusData.video_url;
        break; // Exit the loop when done
      } else if (videoStatus === "failed") {
        const errorDetails = statusData.error
          ? JSON.stringify(statusData.error)
          : "Unknown error";
        throw new Error(`Video generation failed. Details: ${errorDetails}`);
      }

      await delay(15000); // Wait 15 seconds before polling again
    }
    // --- END OF CORRECTED CODE ---

    console.log("🎉 Video is ready!");
    console.log(`🔗 Watch your video here: ${videoUrl}`);
  } catch (error) {
    console.error("❌ An error occurred:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

main();
