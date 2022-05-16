module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://admin:123qwert@glodaodb.lenil.mongodb.net/dev_voting?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
  },
});
