'use strict';

const koa     = require('koa');
const app     = koa();

app.use(function *(){
  this.body = 'Hello, Manhunt!! - garbagecodeabc';
});

app.listen(3000);