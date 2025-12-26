/**
 * Application configuration types
 */

/**
 * OIDC Configuration from config.json or environment variables
 */
export interface OidcConfig {
  issuer_url: string;
  client_id: string;
}

/**
 * Full application configuration
 */
export interface AppConfig {
  oidc: OidcConfig;
  api_url?: string;
  in_development_mode: boolean;
}

/**
 * Runtime configuration loaded from config.json or environment
 */
export interface RuntimeConfig {
  OIDC_ISSUER_URL: string;
  OIDC_CLIENT_ID: string;
  API_URL?: string;
  IN_DEVELOPMENT_MODE: boolean;
}

/**
 * Global window extensions for configuration
 */
declare global {
  interface Window {
    issuerUrl?: string;
    oidcConfiguration?: {
      client_id: string;
      redirect_uri: string;
      scope: string;
      authority: string;
      silent_redirect_uri?: string;
      monitor_session?: boolean;
    };
    inDevelopmentMode: boolean;
  }
}

export {};
