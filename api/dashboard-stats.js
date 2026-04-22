import { createPool } from '@vercel/postgres';

const pool = createPool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL
});

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

    try {
        const { dateFrom, dateTo, table = 'shipment_logs' } = req.query;
        const validTables = ['shipment_logs', 'shipment_test_logs'];
        const targetTable = validTables.includes(table) ? table : 'shipment_logs';

        let dateFilter = '';
        const params = [];
        if (dateFrom && dateTo) {
            dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
            params.push(`${dateFrom} 00:00:00`, `${dateTo} 23:59:59`);
        }

        const summaryQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN log_type = 'Success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN log_type = 'Error' THEN 1 ELSE 0 END) as errors,
                SUM(CASE WHEN respond_invoice IS NOT NULL THEN 1 ELSE 0 END) as with_invoice
            FROM ${targetTable} ${dateFilter}
        `;

        const dailyQuery = `
            SELECT 
                TO_CHAR(created_at::timestamp, 'Mon DD') as date,
                COUNT(*) as count
            FROM ${targetTable} ${dateFilter}
            GROUP BY TO_CHAR(created_at::timestamp, 'Mon DD'), (created_at::timestamp)::date
            ORDER BY (created_at::timestamp)::date ASC
        `;

        const countryQuery = `
            SELECT 
                shipper_country as country,
                COUNT(*) as count
            FROM ${targetTable} ${dateFilter}
            ${dateFilter ? 'AND' : 'WHERE'} shipper_country IS NOT NULL
            GROUP BY shipper_country
            ORDER BY count DESC
            LIMIT 5
        `;

        const [summaryResult, dailyResult, countryResult] = await Promise.all([
            pool.query(summaryQuery, params),
            pool.query(dailyQuery, params),
            pool.query(countryQuery, params)
        ]);

        const summary = summaryResult.rows[0];
        
        res.status(200).json({
            summary: {
                totalShipments: parseInt(summary.total || 0),
                successful: parseInt(summary.successful || 0),
                errors: parseInt(summary.errors || 0),
                withInvoice: parseInt(summary.with_invoice || 0)
            },
            dailyVolume: dailyResult.rows,
            topCountries: countryResult.rows
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            message: 'Internal Server Error', 
            error: error.message,
            stack: error.stack
        });
    }
}
