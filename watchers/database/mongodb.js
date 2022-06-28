"use strict";
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.NODE_ENV === "production"
    ? "mongodb+srv://admin:123qwert@glodaodb.lenil.mongodb.net/dev_voting?retryWrites=true&w=majority"
    : "mongodb+srv://admin:123qwert@glodaodb.lenil.mongodb.net/dev_voting?retryWrites=true&w=majority";

let db = null;
/**
 * Singleton của mongodb
 */
async function init() {
  if (db == null) {
    db = await mongoose.createConnection(MONGODB_URI, {
      // Buffering means mongoose will queue up operations if it gets
      // disconnected from MongoDB and send them when it reconnects.
      // With serverless, better to fail fast if not connected.
      // bufferCommands: false, // Disable mongoose buffering
      // bufferMaxEntries: 0, // and MongoDB driver buffering
      useNewUrlParser: true,
      // useFindAndModify: false,
      // useCreateIndex: true,
      useUnifiedTopology: true,
    });
  }
  return db;
}

module.exports = {
  init,
  db() {
    return db;
  },
};
