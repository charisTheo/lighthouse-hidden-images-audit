export default {
  extends: 'lighthouse:default',

  artifacts: [
    {id: 'PageImages', gatherer: 'hidden-images-gatherer'},
  ],
  audits: [
    'hidden-images-audit',
  ],

  categories: {
    // performance: {
    //   auditRefs: [
    //     {id: 'hidden-images-audit', weight: 0, group: 'load-opportunities'},
    //   ],
    // },
    mysite: {
      title: 'My custom audits',
      description: 'Custom performance audits',
      auditRefs: [
        {id: 'hidden-images-audit', weight: 1},
      ],
    },
  },
  settings: {
    onlyCategories: ['mysite'],
    // onlyAudits: ['hidden-images-audit'],
  },
};
