const path = require('path');
const normalizeUrl = require('normalize-url');

module.exports.normaliseUrl = (url) => {
  return normalizeUrl(url, {
    defaultProtocol: 'https:',
    forceHttps: true,
    normalizeProtocol: true,
    stripWWW: false,
  });
};

module.exports.normaliseImagePath = (url, deviceName) => {
  const normalisedUrl = url.replace(/\/|:/g, '_');
  return path.join(
      __dirname,
      `../puppeteer/screenshots/${normalisedUrl}-${deviceName}.png`,
  );
};
