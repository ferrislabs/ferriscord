/**
 * Configuration loader utility
 * Loads configuration from config.json (production) or environment variables (development)
 */

import type { AppConfig, RuntimeConfig } from "@/types/config";

/**
 * Load configuration from config.json file
 */
async function loadConfigFromFile(): Promise<RuntimeConfig | null> {
  try {
    const response = await fetch("/config.json", {
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        "config.json not found, falling back to environment variables",
      );
      return null;
    }

    const config = await response.json();
    return {
      IN_DEVELOPMENT_MODE: false,
      OIDC_ISSUER_URL: config.oidc_issuer_url,
      OIDC_CLIENT_ID: config.oidc_client_id,
      API_URL: config.api_url,
    } as RuntimeConfig;
  } catch (error) {
    console.warn("Failed to load config.json:", error);
    return null;
  }
}

/**
 * Load configuration from environment variables (Vite)
 */
function loadConfigFromEnv(): RuntimeConfig | null {
  const issuerUrl = import.meta.env.VITE_OIDC_ISSUER_URL;
  const clientId = import.meta.env.VITE_OIDC_CLIENT_ID;
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!issuerUrl || !clientId) {
    return null;
  }

  return {
    OIDC_ISSUER_URL: issuerUrl,
    OIDC_CLIENT_ID: clientId,
    API_URL: apiUrl,
    IN_DEVELOPMENT_MODE: true,
  };
}

/**
 * Load application configuration
 * Tries config.json first, then falls back to environment variables
 */
export async function loadAppConfig(): Promise<AppConfig> {
  // Try loading from config.json (production)
  let runtimeConfig = await loadConfigFromFile();

  // Fall back to environment variables (development)
  if (!runtimeConfig) {
    runtimeConfig = loadConfigFromEnv();
  }

  // Validate configuration
  if (
    !runtimeConfig ||
    !runtimeConfig.OIDC_ISSUER_URL ||
    !runtimeConfig.OIDC_CLIENT_ID
  ) {
    throw new Error(
      "Missing required configuration. Please ensure OIDC_ISSUER_URL and OIDC_CLIENT_ID are set in config.json or environment variables.",
    );
  }

  // Transform to AppConfig format
  const config: AppConfig = {
    oidc: {
      issuer_url: runtimeConfig.OIDC_ISSUER_URL,
      client_id: runtimeConfig.OIDC_CLIENT_ID,
    },
    api_url: runtimeConfig.API_URL,
    in_development_mode: runtimeConfig.IN_DEVELOPMENT_MODE,
  };

  return config;
}

/**
 * Setup global OIDC configuration from AppConfig
 */
export function setupOidcConfiguration(config: AppConfig): void {
  window.issuerUrl = config.oidc.issuer_url;
  window.oidcConfiguration = {
    client_id: config.oidc.client_id,
    redirect_uri: window.location.origin + "/authentication/callback",
    silent_redirect_uri:
      window.location.origin + "/authentication/silent-callback",
    scope: "openid profile email",
    authority: config.oidc.issuer_url,
    monitor_session: true,
  };
  window.inDevelopmentMode = config.in_development_mode;
}

/**
 * Initialize application configuration
 * Loads config and sets up OIDC
 */
export async function initializeAppConfig(): Promise<{
  config: AppConfig;
  error: string | null;
}> {
  try {
    const config = await loadAppConfig();
    setupOidcConfiguration(config);

    return {
      config,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown configuration error";
    console.error("Failed to initialize app configuration:", errorMessage);

    return {
      config: null as any,
      error: errorMessage,
    };
  }
}
