const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

/**
 * Pulls device + location info straight from the request — never trust
 * these values if a client sends them in the request body.
 *
 * Requires: npm install ua-parser-js geoip-lite
 * (both work offline, no external API calls / no extra latency)
 */
const getDeviceInfo = (req) => {
  const parser = new UAParser(req.headers["user-agent"]);
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";
  const device = `${browser} · ${os}`;

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "";

  const geo = geoip.lookup(ip);
  const location = geo
    ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ")
    : "Unknown location";

  return { browser, os, device, location, ip };
};

module.exports = getDeviceInfo;