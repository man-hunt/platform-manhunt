'use strict';

const koa     = require('koa');
const app     = koa();

app.use(function *(){
  this.body = 'Hello, Manhunt!! - garbagecodea';
});

app.listen(3000);