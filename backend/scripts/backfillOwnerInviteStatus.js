// One-off migration: owner memberships created before Module 6 have
// githubInviteStatus: "pending". Owners never need a GitHub invite,
// so set them to "not_applicable".
//
// Run: node scripts/backfillOwnerInviteStatus.js
//
// Safe to run multiple times (idempotent).

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[backfill] Connected');

  const result = await mongoose.connection.collection('memberships').updateMany(
    { role: 'owner', githubInviteStatus: { $ne: 'not_applicable' } },
    { $set: { githubInviteStatus: 'not_applicable', githubInviteUpdatedAt: new Date() } }
  );

  console.log(`[backfill] Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[backfill] Error:', err);
  process.exit(1);
});