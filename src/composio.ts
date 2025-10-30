// src/composio.ts

import { Composio } from "@composio/core";
import { OpenAIAgentsProvider } from "@composio/openai-agents";

// Initialize the main Composio client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIAgentsProvider(),
});

interface ConnectionConfig {
  githubAuthConfigId: string; // CHANGED
  heygenAuthConfigId: string; // CHANGED
  slackAuthConfigId: string; // CHANGED
}

/**
 * Creates a Tool Router session pre-configured with existing connected accounts.
 * @param userId - A unique identifier for the user running the session.
 * @param config - The connection IDs for the required tools.
 * @returns The Tool Router session object.
 */
export async function createToolRouterSession(
  userId: string,
  config: ConnectionConfig
) {
  console.log("🔄 Initializing secure Tool Router session...");

  const session = await composio.experimental.toolRouter.createSession(userId, {
    toolkits: [
      {
        toolkit: "github",
        authConfigId: config.githubAuthConfigId, // CHANGED
      },
      {
        toolkit: "heygen",
        authConfigId: config.heygenAuthConfigId, // CHANGED
      },
      {
        toolkit: "slack",
        authConfigId: config.slackAuthConfigId, // CHANGED
      },
    ],
    // This flag is important to ensure it uses only the provided accounts
    manuallyManageConnections: true,
  });

  console.log("✅ Tool Router session created.");
  return session;
}
