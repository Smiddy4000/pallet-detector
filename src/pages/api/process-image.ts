import type { NextApiRequest, NextApiResponse } from 'next';
import { forwardFunctionRequest, isAuthenticated } from '../../utils/serverApi';

const MAX_IMAGE_LENGTH = 7_000_000;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '7mb',
        },
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end();
    }
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const photo = req.body?.photo;
    if (typeof photo !== 'string' || !photo.startsWith('data:image/jpeg;base64,') || photo.length > MAX_IMAGE_LENGTH) {
        return res.status(400).json({ error: 'Invalid image data' });
    }

    try {
        const response = await forwardFunctionRequest('ProcessImageRequest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo }),
        });
        const body = await response.text();
        if (!response.ok) {
            return res.status(502).json({ error: 'Image processing failed' });
        }
        return res.status(200).json(JSON.parse(body));
    } catch {
        return res.status(502).json({ error: 'Image processing service unavailable' });
    }
}
