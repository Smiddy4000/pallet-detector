import type { NextApiRequest } from 'next';

export function requiredEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function isAuthenticated(req: NextApiRequest): boolean {
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    const encodedPrincipal = req.headers['x-ms-client-principal'];
    if (typeof encodedPrincipal !== 'string') {
        return false;
    }

    try {
        const principal = JSON.parse(Buffer.from(encodedPrincipal, 'base64').toString('utf8'));
        return typeof principal.auth_typ === 'string'
            && principal.auth_typ.length > 0
            && Array.isArray(principal.claims)
            && principal.claims.some((claim: unknown) => {
                if (!claim || typeof claim !== 'object') {
                    return false;
                }
                const typedClaim = claim as { typ?: unknown; val?: unknown };
                return typeof typedClaim.typ === 'string'
                    && typeof typedClaim.val === 'string'
                    && typedClaim.val.length > 0
                    && /(?:objectidentifier|nameidentifier|oid|sub)$/.test(typedClaim.typ);
            });
    } catch {
        return false;
    }
}

export function forwardFunctionRequest(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = requiredEnvironmentVariable('FUNCTION_API_BASE_URL');
    const functionKey = requiredEnvironmentVariable('FUNCTION_API_KEY');
    const url = new URL(`/api/${path}`, baseUrl);
    const headers = new Headers(init?.headers);
    headers.set('x-functions-key', functionKey);
    return fetch(url, { ...init, headers });
}
