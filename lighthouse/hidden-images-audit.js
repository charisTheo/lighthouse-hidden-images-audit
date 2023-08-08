/* eslint-disable max-len */
/**
 * @fileoverview Checks that no hidden images have been
 *  downloaded through the network
 */

import './../analyser/src/image.d.js';
import {UIStrings} from 'lighthouse/core/lib/i18n/i18n.js';
import UrlUtils from 'lighthouse/core/lib/url-utils.js';
import {NetworkRequest} from 'lighthouse/core/lib/network-request.js';
import {Audit, NetworkRecords} from 'lighthouse';

const IGNORE_THRESHOLD_IN_BYTES = 2048;

// eslint-disable-next-line require-jsdoc
class HiddenImages extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'hidden-images-audit',
      title: 'Does not download hidden images',
      failureTitle: 'Hidden images are downloaded',
      description: 'Prevent non-visible images from ' +
      'being downloaded. ' +
      '[Learn more](https://www.harrytheo.com/blog/2021/03/optimised-images-for-the-web-responsive-and-adaptable/#the--display-none--trap).',
      scoreDisplayMode: Audit.SCORING_MODES.NUMERIC,
      requiredArtifacts: ['PageImages', 'devtoolsLogs', 'traces'],
    };
  }

  /**
   * @param {Image} image
   * @param {Array<LH.Artifacts.NetworkRecord>} networkRecords
   * @return {null|Error|LH.Audit.ByteEfficiencyItem}
   */
  static computeWaste(image, networkRecords) {
    const networkRecord = networkRecords.find((record, i) => {
      return record.url === image.currentSrc;
    }) || {};
    const url = UrlUtils.elideDataURI(image.currentSrc);
    const {resourceSize = 0, transferSize = 0} = networkRecord;
    const totalBytes = Math.min(resourceSize, transferSize);
    const wastedBytes = totalBytes;

    return {
      url,
      totalBytes,
      wastedBytes,
      // wastedPercent: 100, (optional)
      currentSrc: image.currentSrc,
    };
  }

  /**
   * Filters out non-image requests that were made within
   * an <img>'s src attribute and images without a network record
   *
   * @param {Array<LH.Audit.ByteEfficiencyItem>} images
   * @param {Array<LH.Artifacts.NetworkRecord>} networkRecords
   * @return {Array<LH.Audit.ByteEfficiencyItem>}
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
   * @param {LH.Audit.Context} context
   * @return {Promise<ByteEfficiencyAudit.ByteEfficiencyProduct>}
   */
  static async audit(artifacts, context) {
    const {images} = artifacts.PageImages;
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    const networkRecords = await NetworkRecords.request(devtoolsLog, context);

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
    }, /** @type {Map<string, LH.Audit.ByteEfficiencyItem>} */ (new Map()));

    /** @type {Array<LH.Audit.ByteEfficiencyItem>} */
    const unfilteredResults = Array.from(resultsMap.values());

    /** @type {Array<LH.Audit.ByteEfficiencyItem>} */
    const items = HiddenImages.filterNonImages(unfilteredResults, networkRecords);
    console.log('\t🏞️ Number of images found:', items.length);

    const wastedBytes = items.reduce((acc, cur) => acc += cur.wastedBytes, 0);
    console.log('\t🔢 wastedBytes:', wastedBytes);

    const score = Audit.computeLogNormalScore({p10: 2000, median: 40000}, wastedBytes);
    console.log('\t💯 score:', score);

    /** @type {LH.Audit.Details.Opportunity['headings']} */
    const headings = [
      {key: 'url', valueType: 'thumbnail', label: ''},
      {key: 'url', valueType: 'url', label: UIStrings.columnURL},
      {key: 'totalBytes', valueType: 'bytes', label: UIStrings.columnResourceSize},
      {key: 'wastedBytes', valueType: 'bytes', label: UIStrings.columnWastedBytes},
    ];

    return {
      warnings,
      items,
      headings,
      score,
      wastedBytesByUrl: resultsMap,
      numericValue: wastedBytes,
      numericUnit: 'byte',
    };
  }
}

export default HiddenImages;
