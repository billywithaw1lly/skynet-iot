import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./src/utils/constants.js";

dotenv.config({ path: "./.env" });

const flush = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
    console.log("✅ Connected!\n");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📦 Collections found:",
      collections.map((c) => c.name),
    );

    const result = await mongoose.connection.db
      .collection("readings")
      .deleteMany({});

    console.log(
      `\n🗑️  Deleted ${result.deletedCount} documents from the readings collection.`,
    );

    // Verify it's empty
    const remaining = await mongoose.connection.db
      .collection("readings")
      .countDocuments();
    console.log(`📊 Documents remaining: ${remaining}`);

    await mongoose.disconnect();
    console.log("\n✅ Done. Connection closed. You can delete this file now.");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

flush();
