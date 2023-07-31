'use strict';

module.exports = {
  extends: 'lighthouse:default',

  passes: [{
    passName: 'defaultPass',
    gatherers: [
      'hidden-images-gatherer',
    ],
  }],
  artifacts: [
    {id: 'PageImages', gatherer: 'hidden-images-gatherer'},
  ],
  audits: [
    'hidden-images-audit',
  ],

  categories: {
    performance: {
      auditRefs: [
        {id: 'hidden-images-audit', weight: 0, group: 'load-opportunities'},
      ],
    },
  },
  settings: {
    onlyCategories: ['performance'],
    // onlyAudits: ['hidden-images-audit'],
  },
};
