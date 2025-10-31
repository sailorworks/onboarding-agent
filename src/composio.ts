// src/composio.ts
import { AuthScheme, Composio } from "@composio/core";
import { OpenAIAgentsProvider } from "@composio/openai-agents";

// Initialize the main Composio client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIAgentsProvider(),
});

/**
 * Creates a Tool Router session for a single, specific toolkit.
 * @param userId - A unique identifier for the user.
 * @param toolkit - The name of the toolkit (e.g., "github").
 * @param authConfigId - The auth config ID for the toolkit.
 * @returns The Tool Router session object.
 */
export async function createSingleToolkitSession(
  userId: string,
  toolkit: "github" | "slack",
  authConfigId: string
) {
  console.log(`🔄 Initializing secure Tool Router session for ${toolkit}...`);

  const session = await composio.experimental.toolRouter.createSession(userId, {
    toolkits: [
      {
        toolkit,
        authConfigId,
      },
    ],
    manuallyManageConnections: true,
  });

  console.log(`✅ ${toolkit} session created.`);
  return session;
}

/**
 * Establishes a direct connection to Heygen using an API key.
 * @param userId - A unique identifier for the user.
 * @param authConfigId - The Heygen auth config ID.
 * @param apiKey - The Heygen API key.
 * @returns The connected account ID for Heygen.
 */
export async function connectHeygenAccount(
  userId: string,
  authConfigId: string,
  apiKey: string
): Promise<string> {
  console.log("🔄 Connecting to HeyGen via Composio...");
  const connection = await composio.connectedAccounts.initiate(
    userId,
    authConfigId,
    {
      config: AuthScheme.APIKey({
        generic_api_key: apiKey,
      }),
      allowMultiple: true,
    }
  );
  console.log("✅ HeyGen account connected successfully.");
  return connection.id;
}
