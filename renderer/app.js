const express = require('express');
const logger = require('morgan');

const router = require('./routes/index');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/', router);

module.exports = app;
