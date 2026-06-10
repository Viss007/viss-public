export declare function getHost(): string;
export declare function getPort(): number;
export declare function getApiKey(): string;
export declare function getPublicUrl(): string;
export declare function getComposioOnboardingBaseUrl(): string;
export declare function getComposioOnboardingUrlTemplate(): string;
export declare function getComposioConnectUrlTemplate(): string;
export declare function getComposioOauthAuthorizeUrl(): string;
export declare function getComposioOauthClientId(): string;
export declare function getComposioOauthRegisterUrl(): string;
export declare function getComposioOauthTokenUrl(): string;
export type Provider = "google_sheets" | "instagram";
export declare function isProvider(value: string): value is Provider;
export declare function buildComposioConnectUrl(provider: Provider, userRef: string): string;
export declare function buildComposioOnboardingUrl(provider: Provider, userRef: string, providerConnectUrl: string): string;
//# sourceMappingURL=config.d.ts.map