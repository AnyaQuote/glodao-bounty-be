const openLocalhost = process.env.OPEN_LOCALHOST === "true";

const getPlatformFromOrigin = (origin) => {
  switch (origin) {
    case "http://localhost:8080":
      if (openLocalhost) return "gld";
      else return "unknown";
    case "http://localhost:7193":
      if (openLocalhost) return "ygg";
      else return "unknown";
    case "https://app.glodao.io":
    case "https://app-voting.glodao.io":
    case "https://dev-bounty.glodao.io":
    case "https://dev-dao-voting.netlify.app":
    case "https://glodao.io":
      return "gld";
    case "https://bounty-dev.yggsea.live":
    case "https://voting-dev.yggsea.live":
    case "https://yggsea.io":
    case "https://dev.yggsea.live":
    case "https://staging.yggsea.live":
    case "https://dev.api-yggsea.com":
    case "https://yggsea.io":
    case "https://yggsea.org":
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
