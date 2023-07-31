/* eslint-disable max-len */
/**
 * @fileoverview Checks that no hidden images have been
 *  downloaded through the network
 */
'use strict';

require('./../analyser/src/image.d');
const i18n = require('lighthouse/lighthouse-core/lib/i18n/i18n.js');
const URL = require('lighthouse/lighthouse-core/lib/url-shim.js');
const ByteEfficiencyAudit = require('lighthouse/lighthouse-core/audits/byte-efficiency/byte-efficiency-audit.js');
const NetworkRequest =
  require('lighthouse/lighthouse-core/lib/network-request');

const UIStrings = {
  title: 'Does not download hidden images',
  failureTitle: 'Hidden images are downloaded',
  description:
    'Prevent non-visible images from ' +
    'being downloaded. ' +
    '[Learn more](https://www.harrytheo.com/blog/2021/03/optimised-images-for-the-web-responsive-and-adaptable/#the--display-none--trap).',
};

const IGNORE_THRESHOLD_IN_BYTES = 2048;

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @typedef {{url: string, totalBytes: number, wastedBytes: number, currentSrc: string}} WasteResult */

// eslint-disable-next-line require-jsdoc
class HiddenImages extends ByteEfficiencyAudit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'hidden-images-audit',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      scoreDisplayMode: ByteEfficiencyAudit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['PageImages', 'devtoolsLogs', 'traces'],
    };
  }

  /**
   * @param {Image} image
   * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
   * @return {null|Error|WasteResult}
   */
  static computeWaste(image, networkRecords) {
    const networkRecord = networkRecords.find((record) => record.url === image.currentSrc) || {};
    const url = URL.elideDataURI(image.currentSrc);
    const {resourceSize = 0, transferSize = 0} = networkRecord;
    const totalBytes = Math.min(resourceSize, transferSize);
    const wastedBytes = totalBytes;

    return {
      url,
      totalBytes,
      wastedBytes,
      currentSrc: image.currentSrc,
    };
  }

  /**
   * Filters out non-image requests that were made within
   * an <img>'s src attribute and images without a network record
   *
   * @param {WasteResult[]} images
   * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
   * @return {WasteResult[]}
   */
  static filterNonImages(images, networkRecords) {
    return images.filter((image) => {
      const networkRecord = networkRecords.find((record) => record.url === image.currentSrc);

      if (!networkRecord) return null;

      // * Filter out requests from a <img src=""/> element
      // * that are NOT images i.e. https://bat.bing.com/action/0?ti=5565242&Ver... in www.mainlinemenswear.co.uk/
      if (
        networkRecord.resourceType !== NetworkRequest.TYPES.Image ||
        networkRecord.mimeType === 'text/plain' ||
        image.wastedBytes < IGNORE_THRESHOLD_IN_BYTES
      ) {
        return null;
      }

      return true;
    });
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {Array<LH.Artifacts.NetworkRequest>} networkRecords
   * @return {Promise<ByteEfficiencyAudit.ByteEfficiencyProduct>}
   */
  static async audit_(artifacts, networkRecords) {
    const {images} = artifacts.PageImages;

    /** @type {string[]} */
    const warnings = [];
    const resultsMap = images.reduce((results, image) => {
      const processed = HiddenImages.computeWaste(image, networkRecords);
      if (processed === null) {
        return results;
      }

      if (processed instanceof Error) {
        warnings.push(processed.message);
        // Sentry.captureException(processed, {tags: {audit: this.meta.id}, level: 'warning'});
        return results;
      }

      // If an image was used more than once, warn only about its least wasteful usage
      const existing = results.get(processed.url);
      if (!existing || existing.wastedBytes > processed.wastedBytes) {
        results.set(processed.url, processed);
      }

      return results;
    // eslint-disable-next-line no-undef
    }, /** @type {Map<string, WasteResult>} */ (new Map()));

    const unfilteredResults = Array.from(resultsMap.values());

    const items = HiddenImages.filterNonImages(unfilteredResults, networkRecords);

    /** @type {LH.Audit.Details.Opportunity['headings']} */
    const headings = [
      {key: 'url', valueType: 'thumbnail', label: ''},
      {key: 'url', valueType: 'url', label: str_(i18n.UIStrings.columnURL)},
      {key: 'totalBytes', valueType: 'bytes', label: str_(i18n.UIStrings.columnResourceSize)},
      {key: 'wastedBytes', valueType: 'bytes', label: str_(i18n.UIStrings.columnWastedBytes)},
    ];

    return {
      warnings,
      items,
      headings,
    };
  }
}

module.exports = HiddenImages;
module.exports.UIStrings = UIStrings;
