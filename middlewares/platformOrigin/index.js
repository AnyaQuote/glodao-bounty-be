const { getPlatformFromOrigin } = require("../../helpers/origin-helper");

module.exports = (strapi) => {
  return {
    initialize() {
      strapi.app.use(async (ctx, next) => {
        const platform = getPlatformFromOrigin(ctx.request.headers.origin);
        const method = ctx.request.method;
        try {
          switch (method) {
            case "GET":
              ctx.query.platform = platform;
              break;
            case "POST":
            case "PUT":
            case "PATCH":
            case "DELETE":
              ctx.request.body.platform = platform;

            default:
              ctx.query.platform = platform;
              ctx.request.body.platform = platform;
              break;
          }
        } catch (error) {
          console.log("origin middle ware error", error);
        }
        console.log('ph')
        await next();
      });
    },
  };
};
