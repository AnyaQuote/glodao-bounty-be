module.exports = {
  load: {
    before: ["boom", "sentry"],
  },
  settings: {
    sentry: {
      dsn: "https://71ef579530144a4db4bcfd686a3607c9@o1211930.ingest.sentry.io/6349722",
      enabled: true,
    },
  },
};
