const db_uri = process.env.DEV_DB_CONNECTION;
console.log(db_uri);

module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://admin:Skymore123@bounty.mzk3ehf.mongodb.net/bounty-dev?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
    bot: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://admin:Skymore123@message-db.dwawp0k.mongodb.net/message?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
  },
});
