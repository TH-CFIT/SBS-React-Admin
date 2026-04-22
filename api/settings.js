import { get } from '@vercel/edge-config';

const ALLOWED_ORIGINS = [
    'https://viruzjoke.github.io',
    'thcfit.duckdns.org',
    'thcfit-admin.duckdns.org',
    'https://thcfit.vercel.app',
    'https://thcfit-admin.vercel.app',
    'https://sbs-react-admin.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

export default async function handler(req, res) {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        try {
            // Read from edge config
            const isProductionOn = await get('production_mode');
            return res.status(200).json({ production_mode: isProductionOn === true });
        } catch (error) {
            console.error('Error reading edge config:', error);
            // Default to false if edge config is not set up
            return res.status(200).json({ production_mode: false, error: 'Edge config not configured properly' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { production_mode } = req.body;
            
            // To write to edge config, we need VERCEL_ACCESS_TOKEN and EDGE_CONFIG_ID
            const token = process.env.VERCEL_ACCESS_TOKEN;
            const edgeConfigId = process.env.EDGE_CONFIG_ID;

            if (!token || !edgeConfigId) {
                return res.status(500).json({ 
                    message: 'Missing VERCEL_ACCESS_TOKEN or EDGE_CONFIG_ID in environment variables.' 
                });
            }

            const updateResponse = await fetch(
                `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        items: [
                            {
                                operation: 'upsert',
                                key: 'production_mode',
                                value: production_mode === true,
                            },
                        ],
                    }),
                }
            );

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json();
                console.error('Failed to update edge config:', errorData);
                return res.status(500).json({ message: 'Failed to update Edge Config', details: errorData });
            }

            return res.status(200).json({ success: true, production_mode });
        } catch (error) {
            console.error('Error updating edge config:', error);
            return res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }

    return res.status(405).end('Method Not Allowed');
}
