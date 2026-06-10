function required(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required env: ${name}`);
    }
    return value;
}
export function getHost() {
    return process.env.HOST?.trim() || "0.0.0.0";
}
export function getPort() {
    return Number(process.env.PORT?.trim() || "3088");
}
export function getApiKey() {
    return required("INTERNAL_API_KEY");
}
export function getPublicUrl() {
    return required("ENGINE_PUBLIC_URL").replace(/\/$/, "");
}
export function getComposioOnboardingBaseUrl() {
    return required("COMPOSIO_ONBOARDING_BASE_URL");
}
export function getComposioOnboardingUrlTemplate() {
    return required("COMPOSIO_ONBOARDING_URL_TEMPLATE");
}
export function getComposioConnectUrlTemplate() {
    return required("COMPOSIO_CONNECT_URL_TEMPLATE");
}
export function getComposioOauthAuthorizeUrl() {
    return required("COMPOSIO_OAUTH_AUTHORIZE_URL");
}
export function getComposioOauthClientId() {
    return process.env.COMPOSIO_OAUTH_CLIENT_ID?.trim() || "";
}
export function getComposioOauthRegisterUrl() {
    return (process.env.COMPOSIO_OAUTH_REGISTER_URL?.trim() ||
        "https://connect.composio.dev/api/v3/auth/dash/oauth2/register");
}
export function getComposioOauthTokenUrl() {
    return (process.env.COMPOSIO_OAUTH_TOKEN_URL?.trim() ||
        "https://connect.composio.dev/api/v3/auth/dash/oauth2/token");
}
export function isProvider(value) {
    return value === "google_sheets" || value === "instagram";
}
export function buildComposioConnectUrl(provider, userRef) {
    const providerAlias = provider === "google_sheets" ? "google_sheets" : "instagram";
    return getComposioConnectUrlTemplate()
        .replaceAll("{provider}", encodeURIComponent(providerAlias))
        .replaceAll("{user_ref}", encodeURIComponent(userRef));
}
export function buildComposioOnboardingUrl(provider, userRef, providerConnectUrl) {
    const providerAlias = provider === "google_sheets" ? "google_sheets" : "instagram";
    return getComposioOnboardingUrlTemplate()
        .replaceAll("{provider}", encodeURIComponent(providerAlias))
        .replaceAll("{user_ref}", encodeURIComponent(userRef))
        .replaceAll("{provider_connect_url}", encodeURIComponent(providerConnectUrl));
}
//# sourceMappingURL=config.js.map