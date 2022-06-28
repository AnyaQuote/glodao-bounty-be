const db_uri = process.env.DEV_DB_CONNECTION;
console.log(db_uri);

module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://admin:123qwert@glodaodb.lenil.mongodb.net/dev?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
    bot: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://admin:eOD2ETY4OhBov3Di@message-db.lyv4kbw.mongodb.net/dev?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
  },
});
