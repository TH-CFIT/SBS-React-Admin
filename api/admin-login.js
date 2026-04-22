// /api/admin-login.js
// API สำหรับตรวจสอบการ Login

// No DB or bcrypt needed for env-based auth


// [สำคัญ] แก้ไข URL นี้ให้เป็น URL ของหน้า Admin ของคุณ
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

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        // ตรวจสอบกับ Environment Variables โดยตรง
        const validUsername = process.env.ADMIN_USERNAME;
        const validPassword = process.env.ADMIN_PASSWORD;

        if (username === validUsername && password === validPassword) {
            // ถ้า Login สำเร็จ
            return res.status(200).json({ message: 'Login successful.' });
        } else {
            // ถ้าข้อมูลไม่ถูกต้อง
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

    } catch (error) {
        console.error('Login API error:', error);
        res.status(500).json({ 
            message: 'An internal server error occurred.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
