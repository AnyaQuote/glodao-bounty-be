const getPlatformFromOrigin = (origin) => {
  switch (origin) {
    case "http://localhost:8080":
      return "gld";
    case "https://app.glodao.io":
    case "https://app-voting.glodao.io":
    case "https://dev-bounty.glodao.io":
    case "https://dev-dao-voting.netlify.app":
      return "gld";
    case "https://bounty-dev.yggsea.live":
    case "https://voting-dev.yggsea.live":
      return "ygg";
    default:
      return "unknown";
  }
};

const getPlatformFromContext = (ctx) => {
  const origin = ctx.request.headers.origin;
  return getPlatformFromOrigin(origin);
};

module.exports = {
  getPlatformFromOrigin,
  getPlatformFromContext,
};
