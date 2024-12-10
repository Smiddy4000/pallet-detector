import type { NextApiRequest, NextApiResponse } from 'next';
import { getAzureOpenAIResponse } from '../../utils/azureOpenAI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const response = await getAzureOpenAIResponse(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ error: 'Error processing request' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}