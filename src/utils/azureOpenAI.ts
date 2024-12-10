import axios from 'axios';

const AZURE_OPENAI_ENDPOINT = 'https://<your-endpoint>.openai.azure.com/v1/engines/<your-engine>/completions';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;

export const getAzureOpenAIResponse = async (prompt: string) => {
    try {
        const response = await axios.post(
            AZURE_OPENAI_ENDPOINT,
            {
                prompt: prompt,
                max_tokens: 100,
                temperature: 0.7,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AZURE_OPENAI_API_KEY}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error calling Azure OpenAI:', error);
        throw new Error('Failed to fetch response from Azure OpenAI');
    }
};