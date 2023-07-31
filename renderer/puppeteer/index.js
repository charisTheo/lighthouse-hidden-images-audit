const puppeteer = require('puppeteer');
const devices = puppeteer.devices;
const path = require('path');
const analyserPath = path.resolve(process.cwd(), './../analyser/lib/index.cjs');
let analyser = null;

try {
  analyser = require(analyserPath);
} catch (err) {
  console.warn(`\n⚠️\tAnalyser script was not found in ${analyserPath}\n`);
  console.warn(`⚠️\tUse the renderer API after Webpack finishes building...\n`);
}

const {
  normaliseImagePath,
  normaliseUrl,
} = require('./../utils/helpers');

const DEFAULT_DEVICE = 'Pixel 2';

module.exports.render = async (_url, options = {}) => {
  // * Always get the newest version of analyser script during development
  delete require.cache[require.resolve(analyserPath)];
  analyser = require(analyserPath);

  const url = normaliseUrl(_url);
  console.info('📱 PUPPETEER: Rendering new URL: ', url);
  const deviceName = options.device || DEFAULT_DEVICE;
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // eslint-disable-next-line max-len
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();
  await page.emulate(devices[deviceName], {viewport: {deviceScaleFactor: 1}});
  await page.goto(url);
  await page.screenshot({path: normaliseImagePath(url, deviceName)});
  const exposed = await page.$$eval('img', analyser.analyse);
  await browser.close();

  console.log(`🌄 EXPOSED: 
        ${!!exposed.images && exposed.images.length ?
            `${exposed.images.length} images found` :
            `No images were found ✅`
}
    `);
  return exposed;
};
