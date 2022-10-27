module.exports = {
  load: {
    before: ["platformOrigin", "boom", "sentry"],
  },
  settings: {
    sentry: {
      dsn: "https://a529c6eef5644fb6b07351fbd30bb400@o1211930.ingest.sentry.io/6349707",
      enabled: true,
    },
    platformOrigin: {
      enabled: false,
    },
  },
};
