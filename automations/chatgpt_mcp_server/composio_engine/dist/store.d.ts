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
export declare function getProviderConnection(userRef: string, provider: Provider): ProviderState | null;
export declare function getUserState(userRef: string): UserState | null;
export declare function setProviderConnection(userRef: string, provider: Provider, connected: boolean): ProviderState;
export {};
//# sourceMappingURL=store.d.ts.map