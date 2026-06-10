export type OAuthProviderId = 'google' | 'clickup';

export type PendingOAuthState = {
  state: string;
  provider: OAuthProviderId;
  linkKey: string | null;
  createdAtMs: number;
  expiresAtMs: number;
};

export type OAuthConnection = {
  provider: OAuthProviderId;
  /** Stable id from the provider (e.g. Google `sub`, ClickUp user id). */
  subject: string;
  /** Opaque id you pass as `?link=` on /auth/:provider so status + future tool calls can scope tokens. */
  linkKey: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAtMs: number | null;
  updatedAtMs: number;
};

export type OAuthStoreSnapshot = {
  pending: Record<string, PendingOAuthState>;
  connections: OAuthConnection[];
};
