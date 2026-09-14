import type { NextApiRequest, NextApiResponse } from 'next';
import { isAuthenticated, requiredEnvironmentVariable } from '../../utils/serverApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end();
    }
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const lat = Number(Array.isArray(req.query.lat) ? req.query.lat[0] : req.query.lat);
    const lon = Number(Array.isArray(req.query.lon) ? req.query.lon[0] : req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'Invalid coordinates' });
    }

    try {
        const url = new URL('https://atlas.microsoft.com/search/address/reverse/json');
        url.searchParams.set('api-version', '1.0');
        url.searchParams.set('query', `${lat},${lon}`);
        url.searchParams.set('subscription-key', requiredEnvironmentVariable('AZURE_MAPS_KEY'));
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(502).json({ error: 'Reverse geocoding failed' });
        }
        return res.status(200).json(await response.json());
    } catch {
        return res.status(502).json({ error: 'Reverse geocoding service unavailable' });
    }
}
