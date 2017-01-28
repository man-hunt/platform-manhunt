'use strict';

const _         = require('lodash');
const util      = require('util');
const mongoose  = require('mongoose');
const koa       = require('koa');
const mount     = require('koa-mount');
const parser    = require('koa-bodyparser');
const cors      = require('koa-cors');

const app       = koa();
const APIv1     = require('./api');
const options   = {
  origin: '*'
};

let mongo = "mongodb://localhost/manhunt";
mongoose.Promise = Promise;
mongoose.connect(mongo);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: not connected to %s', mongo));
db.once('open', function () {
  console.log('Connected to %s', mongo);
});

app.use(cors(options));
app.use(parser());

app.use(function * (next) {
  this.body = this.request.body;
  console.log('Request %s from %s with request: %s', this.request.href, this.request.ip, util.inspect(this.request, {depth: null}));
  yield next;
  console.log('Response status %s', this.response.status);
});

app.use(mount('/v1', APIv1.middleware()));

if (!module.parent) app.listen(3000);
console.log('Manhunt is Running on http://localhost:3000/');