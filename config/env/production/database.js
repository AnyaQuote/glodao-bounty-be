module.exports = ({ env }) => ({
  defaultConnection: "default",
  connections: {
    default: {
      connector: "mongoose",
      settings: {
        client: "mongo",
        uri: "mongodb+srv://glodao:321ewqqwe@production.m7by5.mongodb.net/glodao-production?retryWrites=true&w=majority",
      },
      options: {
        ssl: true,
      },
    },
  },
});
