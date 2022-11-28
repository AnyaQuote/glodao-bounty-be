const db_uri = process.env.DEV_DB_CONNECTION;
const mainDevUri =
  "mongodb+srv://admin:Skymore123@bounty.mzk3ehf.mongodb.net/bounty-dev?retryWrites=true&w=majority";
const botDevUri =
  "mongodb+srv://admin:Skymore123@message-db.dwawp0k.mongodb.net/message?retryWrites=true&w=majority";
const CONNECTION_URI = process.env.DB_CONNECTION;
const BOT_CONNECTION_URI = process.env.BOT_DB_CONNECTION;

module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: CONNECTION_URI,
      },
      options: {
        ssl: true,
      },
    },
    bot: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: BOT_CONNECTION_URI,
      },
      options: {
        ssl: true,
      },
    },
  },
});
