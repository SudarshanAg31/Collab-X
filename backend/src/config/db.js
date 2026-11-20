const mongoose = require('mongoose');

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