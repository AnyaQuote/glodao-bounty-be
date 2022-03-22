module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://anhdt:123qwert@dev.v8kyz.mongodb.net/diversity-prod?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
  },
});
