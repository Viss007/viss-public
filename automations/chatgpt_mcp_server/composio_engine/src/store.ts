import { Provider } from "./config.js";

type ProviderState = {
  connected: boolean;
  updatedAtIso: string;
};

type UserState = {
  composioAccountReady?: boolean;
  composioUpdatedAtIso?: string;
  providers: Partial<Record<Provider, ProviderState>>;
};

const users = new Map<string, UserState>();

export function getProviderConnection(userRef: string, provider: Provider): ProviderState | null {
  return users.get(userRef)?.providers?.[provider] || null;
}

export function getUserState(userRef: string): UserState | null {
  return users.get(userRef) || null;
}

export function setProviderConnection(userRef: string, provider: Provider, connected: boolean): ProviderState {
  let userState = users.get(userRef);
  if (!userState) {
    userState = { providers: {} };
    users.set(userRef, userState);
  }
  const state: ProviderState = {
    connected,
    updatedAtIso: new Date().toISOString()
  };
  userState.providers[provider] = state;
  if (connected) {
    userState.composioAccountReady = true;
    userState.composioUpdatedAtIso = state.updatedAtIso;
  }
  return state;
}
