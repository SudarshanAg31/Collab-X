const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken'); // imported now so it's ready for Module 2

const { connectDB } = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in .env');
        await connectDB();

        app.listen(PORT, () => {
            console.log(`[server] CollabX backend on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
        });
    } catch (err) {
        console.error('[server] Failed to start:', err.message);
        process.exit(1);
    }
})();