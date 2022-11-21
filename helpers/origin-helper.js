const openLocalhost = process.env.OPEN_LOCALHOST === "true";

const getPlatformFromOrigin = (origin) => {
  switch (origin) {
    case "http://localhost:8080":
      if (openLocalhost) return "gld";
      else return "unknown";
    case "http://localhost:7193":
      if (openLocalhost) return "ygg";
      else return "unknown";
    case "http://localhost:2618":
      if (openLocalhost) return "dev";
      else return "unknown";
    case "https://bounty-dev.yggsea.live":
      return "ygg";
      break;
    case "https://voting-dev.yggsea.live":
      return "ygg";
      break;
    case "https://dev.yggsea.live":
      return "ygg";
      break;
    case "https://staging.yggsea.live":
      return "ygg";
      break;
    case "https://dev.api-yggsea.com":
      return "ygg";
      break;
    case "https://yggsea.io":
      return "ygg";
      break;
    case "https://yggsea.org":
      return "ygg";
    case "https://app.glodao.io":
      return "gld";
      break;
    case "https://app-voting.glodao.io":
      return "gld";
      break;
    case "https://dev-bounty.glodao.io":
      return "gld";
      break;
    case "https://dev-dao-voting.netlify.app":
      return "gld";
      break;
    case "https://glodao.io":
      return "gld";
      break;
    case "https://dev-voting.glodao.io":
      return "gld";
      break;
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
