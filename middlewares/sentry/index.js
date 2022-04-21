const Sentry = require("@sentry/node");
Sentry.init({
  dsn: strapi.config.middleware.settings.sentry.dsn,
  environment: strapi.config.environment,
});

module.exports = (strapi) => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        try {
          await next();
        } catch (error) {
          const { user } = ctx.state;
          const { query, params, request, response } = ctx;
          Sentry.configureScope(function (scope) {
            scope.setUser({ ...user, ip_address: "{{auto}}" });
            scope.setRequestSession(request);
            scope.setTransactionName(`${request.route.endpoint}`);
            scope.setContext("CLIENT SYSTEM", {
              "user-agent": request.header["user-agent"],
            });
            scope.setContext("request", request);
            scope.setContext("response", response);
            scope.setExtras({ query, params, "request body": request.body });
          });
          Sentry.captureException(error);
          throw error;
        }
      });
    },
  };
};
