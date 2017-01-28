'use strict';

const Router    = require('koa-router');
const User      = require('../models/user');

const router = new Router();

router.get('/users', function* (){
	let users = yield User.find({})
	.catch(error => {
		this.throw(error.message, 400);
	});
	this.response.body = {
		users: users
	}
	this.response.status = 200;
});

router.post('/users', function* (){
	let ctx = this;
	let user = ctx.request.body;
	let newUser = yield User.create(user).catch(error => {
		this.throw(error.message, 400);
	});
	this.response.body = newUser;
	this.response.status = 200;
});

router.put('/users', function* (){
	let ctx = this;
	let id = ctx.body.id;
});

router.delete('/users', function* (){
	let ctx = this;
	let id = ctx.body.id;
});

module.exports = router;