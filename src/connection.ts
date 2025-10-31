// src/connection.ts

/**
 * Loads and validates the required auth config IDs
 * from environment variables. Throws an error if any are missing.
 */
export function getConnectionConfig() {
  const {
    GITHUB_AUTH_CONFIG_ID,
    HEYGEN_AUTH_CONFIG_ID,
    SLACK_AUTH_CONFIG_ID,
    SLACK_CHANNEL_ID,
  } = process.env;

  if (!GITHUB_AUTH_CONFIG_ID) {
    throw new Error("Missing GITHUB_AUTH_CONFIG_ID in .env file.");
  }
  if (!HEYGEN_AUTH_CONFIG_ID) {
    throw new Error("Missing HEYGEN_AUTH_CONFIG_ID in .env file.");
  }
  if (!SLACK_AUTH_CONFIG_ID) {
    throw new Error("Missing SLACK_AUTH_CONFIG_ID in .env file.");
  }
  if (!SLACK_CHANNEL_ID) {
    throw new Error("Missing SLACK_CHANNEL_ID in .env file.");
  }

  return {
    githubAuthConfigId: GITHUB_AUTH_CONFIG_ID,
    heygenAuthConfigId: HEYGEN_AUTH_CONFIG_ID,
    slackAuthConfigId: SLACK_AUTH_CONFIG_ID,
    slackChannelId: SLACK_CHANNEL_ID,
  };
}
