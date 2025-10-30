// src/connection.ts

/**
 * Loads and validates the required connection and configuration IDs
 * from environment variables. Throws an error if any are missing.
 */
export function getConnectionConfig() {
  const {
    GITHUB_AUTH_CONFIG_ID, // CHANGED
    HEYGEN_AUTH_CONFIG_ID, // CHANGED
    SLACK_AUTH_CONFIG_ID, // CHANGED
    SLACK_CHANNEL_ID,
  } = process.env;

  if (!GITHUB_AUTH_CONFIG_ID) {
    throw new Error("Missing GITHUB_AUTH_CONFIG_ID in .env file."); // CHANGED
  }
  if (!HEYGEN_AUTH_CONFIG_ID) {
    throw new Error("Missing HEYGEN_AUTH_CONFIG_ID in .env file."); // CHANGED
  }
  if (!SLACK_AUTH_CONFIG_ID) {
    throw new Error("Missing SLACK_AUTH_CONFIG_ID in .env file."); // CHANGED
  }
  if (!SLACK_CHANNEL_ID) {
    throw new Error("Missing SLACK_CHANNEL_ID in .env file.");
  }

  return {
    githubAuthConfigId: GITHUB_AUTH_CONFIG_ID, // CHANGED
    heygenAuthConfigId: HEYGEN_AUTH_CONFIG_ID, // CHANGED
    slackAuthConfigId: SLACK_AUTH_CONFIG_ID, // CHANGED
    slackChannelId: SLACK_CHANNEL_ID,
  };
}
