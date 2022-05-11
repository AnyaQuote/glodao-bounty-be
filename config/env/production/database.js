const CONNECTION_URI = process.env.DB_CONNECTION;

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
  },
});
