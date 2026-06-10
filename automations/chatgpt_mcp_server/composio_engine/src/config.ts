function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getHost(): string {
  return process.env.HOST?.trim() || "0.0.0.0";
}

export function getPort(): number {
  return Number(process.env.PORT?.trim() || "3088");
}

export function getApiKey(): string {
  return required("INTERNAL_API_KEY");
}

export function getPublicUrl(): string {
  return required("ENGINE_PUBLIC_URL").replace(/\/$/, "");
}

export function getComposioOnboardingBaseUrl(): string {
  return required("COMPOSIO_ONBOARDING_BASE_URL");
}

export function getComposioOnboardingUrlTemplate(): string {
  return required("COMPOSIO_ONBOARDING_URL_TEMPLATE");
}

export function getComposioConnectUrlTemplate(): string {
  return required("COMPOSIO_CONNECT_URL_TEMPLATE");
}

export function getComposioOauthAuthorizeUrl(): string {
  return required("COMPOSIO_OAUTH_AUTHORIZE_URL");
}

export function getComposioOauthClientId(): string {
  return process.env.COMPOSIO_OAUTH_CLIENT_ID?.trim() || "";
}

export function getComposioOauthRegisterUrl(): string {
  return (
    process.env.COMPOSIO_OAUTH_REGISTER_URL?.trim() ||
    "https://connect.composio.dev/api/v3/auth/dash/oauth2/register"
  );
}

export function getComposioOauthTokenUrl(): string {
  return (
    process.env.COMPOSIO_OAUTH_TOKEN_URL?.trim() ||
    "https://connect.composio.dev/api/v3/auth/dash/oauth2/token"
  );
}

export type Provider = "google_sheets" | "instagram";

export function isProvider(value: string): value is Provider {
  return value === "google_sheets" || value === "instagram";
}

export function buildComposioConnectUrl(provider: Provider, userRef: string): string {
  const providerAlias = provider === "google_sheets" ? "google_sheets" : "instagram";
  return getComposioConnectUrlTemplate()
    .replaceAll("{provider}", encodeURIComponent(providerAlias))
    .replaceAll("{user_ref}", encodeURIComponent(userRef));
}

export function buildComposioOnboardingUrl(provider: Provider, userRef: string, providerConnectUrl: string): string {
  const providerAlias = provider === "google_sheets" ? "google_sheets" : "instagram";
  return getComposioOnboardingUrlTemplate()
    .replaceAll("{provider}", encodeURIComponent(providerAlias))
    .replaceAll("{user_ref}", encodeURIComponent(userRef))
    .replaceAll("{provider_connect_url}", encodeURIComponent(providerConnectUrl));
}
