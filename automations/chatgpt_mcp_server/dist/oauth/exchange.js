function decodeJwtPayload(idToken) {
    const parts = idToken.split('.');
    if (parts.length < 2)
        return null;
    try {
        const json = Buffer.from(parts[1], 'base64url').toString('utf8');
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
export async function exchangeGoogleCode(clientId, clientSecret, code, redirectUri) {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const json = (await res.json());
    if (!res.ok) {
        throw new Error(json.error || `Google token exchange failed (${res.status})`);
    }
    const accessToken = json.access_token;
    if (!accessToken)
        throw new Error('Google token response missing access_token');
    let subject = 'unknown';
    if (json.id_token) {
        const payload = decodeJwtPayload(json.id_token);
        const sub = payload?.sub;
        if (typeof sub === 'string' && sub)
            subject = sub;
    }
    const expiresAtMs = typeof json.expires_in === 'number' ? Date.now() + json.expires_in * 1000 : null;
    return {
        subject,
        accessToken,
        refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
        expiresAtMs,
    };
}
export async function exchangeClickUpCode(clientId, clientSecret, code) {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
    });
    const res = await fetch('https://api.clickup.com/api/v2/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
    const json = (await res.json());
    if (!res.ok) {
        throw new Error(json.error || `ClickUp token exchange failed (${res.status})`);
    }
    const accessToken = json.access_token;
    if (!accessToken)
        throw new Error('ClickUp token response missing access_token');
    let subject = 'unknown';
    if (json.user && typeof json.user.id === 'number') {
        subject = String(json.user.id);
    }
    else {
        const me = await fetch('https://api.clickup.com/api/v2/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (me.ok) {
            const u = (await me.json());
            if (u.user?.id !== undefined)
                subject = String(u.user.id);
        }
    }
    return { subject, accessToken, refreshToken: null, expiresAtMs: null };
}
export async function exchangeCode(provider, clientId, clientSecret, code, redirectUri) {
    if (provider === 'google') {
        return exchangeGoogleCode(clientId, clientSecret, code, redirectUri);
    }
    const cu = await exchangeClickUpCode(clientId, clientSecret, code);
    return { ...cu, refreshToken: cu.refreshToken };
}
