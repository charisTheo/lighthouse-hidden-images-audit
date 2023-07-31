const express = require('express');
const router = new express.Router();
const puppeteer = require('./../puppeteer');

router
    .post('/expose', async (req, res) => {
      const {url, options} = req.body;
      const exposed = await puppeteer.render(url, options);
      res.status(200).send(JSON.stringify(exposed));
    })
    .get('/', (req, res, next) => {
      res.send('Woohoo!');
    });

module.exports = router;
