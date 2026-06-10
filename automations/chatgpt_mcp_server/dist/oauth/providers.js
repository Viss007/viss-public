export function getPublicBaseUrl() {
    const u = process.env.LEADFLOW_PUBLIC_URL?.trim();
    if (!u)
        return null;
    return u.replace(/\/$/, '');
}
export function getProviderConfig(id) {
    if (id === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
        if (!clientId || !clientSecret)
            return null;
        return { clientId, clientSecret };
    }
    if (id === 'clickup') {
        const clientId = process.env.CLICKUP_CLIENT_ID?.trim();
        const clientSecret = process.env.CLICKUP_CLIENT_SECRET?.trim();
        if (!clientId || !clientSecret)
            return null;
        return { clientId, clientSecret };
    }
    return null;
}
export function googleAuthorizeUrl(params) {
    const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    u.searchParams.set('client_id', params.clientId);
    u.searchParams.set('redirect_uri', params.redirectUri);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', params.scopes.join(' '));
    u.searchParams.set('state', params.state);
    u.searchParams.set('access_type', 'offline');
    u.searchParams.set('prompt', 'consent');
    return u.toString();
}
export function clickupAuthorizeUrl(params) {
    const u = new URL('https://app.clickup.com/api');
    u.searchParams.set('client_id', params.clientId);
    u.searchParams.set('redirect_uri', params.redirectUri);
    u.searchParams.set('state', params.state);
    return u.toString();
}
