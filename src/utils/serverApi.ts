import type { NextApiRequest } from 'next';

export function requiredEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export function isAuthenticated(req: NextApiRequest): boolean {
    return process.env.NODE_ENV !== 'production' || typeof req.headers['x-ms-client-principal'] === 'string';
}

export function forwardFunctionRequest(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = requiredEnvironmentVariable('FUNCTION_API_BASE_URL');
    const functionKey = requiredEnvironmentVariable('FUNCTION_API_KEY');
    const url = new URL(`/api/${path}`, baseUrl);
    const headers = new Headers(init?.headers);
    headers.set('x-functions-key', functionKey);
    return fetch(url, { ...init, headers });
}
