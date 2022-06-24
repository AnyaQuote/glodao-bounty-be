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
