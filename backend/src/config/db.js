const dns = require('dns');
const mongoose = require('mongoose');

// Use reliable DNS servers to resolve MongoDB Atlas SRV records without querySrv ETIMEOUT
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback to system default
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`[db] MongoDB connected → ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] Connection failed:', err.message);
    throw err;
  }
}

module.exports = { connectDB };