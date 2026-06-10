const users = new Map();
export function getProviderConnection(userRef, provider) {
    return users.get(userRef)?.providers?.[provider] || null;
}
export function getUserState(userRef) {
    return users.get(userRef) || null;
}
export function setProviderConnection(userRef, provider, connected) {
    let userState = users.get(userRef);
    if (!userState) {
        userState = { providers: {} };
        users.set(userRef, userState);
    }
    const state = {
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
//# sourceMappingURL=store.js.map