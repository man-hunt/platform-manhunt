'use strict';

const koa     = require('koa');
const app     = koa();

app.use(function *(){
  this.body = 'Hello, Manhunt!! - garbagecodeabcde';
});

app.listen(3000);