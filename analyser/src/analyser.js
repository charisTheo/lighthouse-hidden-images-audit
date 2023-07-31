import './image.d.js';

// lighthouse/lighthouse-core/lib/page-functions/getNodeDetails
/* global getNodeDetails */

/**
 *
 * @param {array<HTMLImageElement>} [imageElements]
 * @return {object.<Image, boolean>}
 */
export const analyse = (imageElements = []) => {
  if (imageElements.length === 0) {
    imageElements = Array.from(document.querySelectorAll('img'));
  }
  const hiddenImgs = [];

  imageElements.forEach( function(img) {
    const {
      parentElement,
      src,
      currentSrc,
      clientHeight,
      classList,
      alt,
      width,
      height,
      loading,
    } = img;

    if (
      (clientHeight === 0 && currentSrc !== '') &&
            (loading !== 'lazy') &&
            !(
              typeof window.lazySizes === 'object' &&
              classList.contains('lazyload')
            )
    ) {
      hiddenImgs.push({
        parentElement: {
          nodeName: parentElement.nodeName,
          classList: [...parentElement.classList],
        },
        src,
        currentSrc,
        clientHeight,
        classList: [...classList],
        alt,
        width,
        height,
        loading,
        node: typeof getNodeDetails !== 'undefined' ?
          getNodeDetails(img) :
          null,
      });
    }
  });
  return {
    images: hiddenImgs,
    usesLazySizes: typeof window.lazySizes === 'object',
  };
};

export default {analyse};
