// src/composio.ts
import { Composio } from "@composio/core";
import { OpenAIAgentsProvider } from "@composio/openai-agents";

// Initialize the main Composio client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIAgentsProvider(),
});

interface ConnectionConfig {
  githubAuthConfigId: string;
  heygenAuthConfigId: string;
  slackAuthConfigId: string;
}

/**
 * Creates a Tool Router session pre-configured with existing connected accounts.
 * @param userId - A unique identifier for the user running the session.
 * @param config - The auth config IDs for the required tools.
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
        authConfigId: config.githubAuthConfigId,
      },
      {
        toolkit: "heygen",
        authConfigId: config.heygenAuthConfigId,
      },
      {
        toolkit: "slack",
        authConfigId: config.slackAuthConfigId,
      },
    ],
    manuallyManageConnections: true,
  });

  console.log("✅ Tool Router session created.");
  return session;
}
