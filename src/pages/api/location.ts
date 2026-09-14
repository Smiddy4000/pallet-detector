import type { NextApiRequest, NextApiResponse } from 'next';
import { forwardFunctionRequest, isAuthenticated } from '../../utils/serverApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end();
    }
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    if (!id || !/^\d{1,64}$/.test(id)) {
        return res.status(400).json({ error: 'Invalid location id' });
    }

    try {
        const response = await forwardFunctionRequest(`GetLocation?id=${encodeURIComponent(id)}`);
        if (!response.ok) {
            return res.status(response.status === 404 ? 404 : 502).json({ error: 'Location lookup failed' });
        }
        return res.status(200).json(await response.json());
    } catch {
        return res.status(502).json({ error: 'Location service unavailable' });
    }
}
