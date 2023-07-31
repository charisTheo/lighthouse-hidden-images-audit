'use strict';

const pageFunctions =
  require('lighthouse/lighthouse-core/lib/page-functions.js');
const Gatherer = require('lighthouse').Gatherer;
const path = require('path');
const fs = require('fs');

const analyserPath = path.resolve(process.cwd(), './../analyser/lib/index.mjs');
let analyser = null;

/**
 * @param {String} path
 * @return {String}
 */
function readModuleFile(path) {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (e) {
    console.error('Hidden Images Gatherer: ' + e);
  }
}

try {
  analyser = readModuleFile(analyserPath);
} catch (err) {
  console.warn(`\n⚠️\tAnalyser script was not found in ${analyserPath}\n`);
  console.warn(`⚠️\tUse the renderer API after Webpack finishes building...\n`);
}

/**
 * @fileoverview Extracts all image (<img>) elements from the test page.
 */
class PageImages extends Gatherer {
  /**
   * @param {Object} context
   * @return {Object} results object -> results.images[]
   */
  afterPass(context) {
    const driver = context.driver;

    // TODO can I use another gatherer instead and run the analyser on results?
    // https://github.com/GoogleChrome/lighthouse/blob/4202f19bd2dde8f8bc87444eb918d9d03d31eb81/lighthouse-core/gather/gatherers/image-elements.js#L55
    // https://github.com/GoogleChrome/lighthouse/blob/95ae481e23b96a4fecd23910fd912f5fd5dceac4/lighthouse-core/audits/byte-efficiency/offscreen-images.js#L51

    // ? Not sure if the check for global `analyse` function here is necessary
    return driver.executionContext
        .evaluate(`async () => typeof analyse !== 'undefined' ? 
          await analyse() : 
          await window.analyse()`, {
          args: [],
          deps: [pageFunctions.getNodeDetailsString, analyser],
        })
        .then((results) => {
          if (!results) {
          // Throw if page didn't provide the metrics we expect. This isn't
          // fatal -- the Lighthouse run will continue, but any audits that
          // depend on this gatherer will show this error string in the report.
            throw new Error('No images were found in the page.');
          }
          return results;
        });
  }
}

module.exports = PageImages;
