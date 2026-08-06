// Run once: node scripts/backfillTokenVersionUpdatedAt.js
// Sets tokenVersionUpdatedAt = createdAt for any user missing the field,
// so their existing valid sessions don't get filtered out as "stale".

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model.js");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany(
    { tokenVersionUpdatedAt: { $exists: false } },
    [{ $set: { tokenVersionUpdatedAt: "$createdAt" } }]
  );

  console.log(`Backfilled ${result.modifiedCount} user(s).`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});