'use strict';

const Router    = require('koa-router');
const User      = require('../models/user');

const router = new Router();

router.get('/users', function* (){
	let ctx = this;
	let users = yield User.find({})
	.catch(error => {
		this.throw(error.message, 400);
	});
	ctx.response.body = {
		users: users
	}
	ctx.response.status = 200;
});

router.post('/users', function* (){
	let ctx = this;
	let user = ctx.request.body;
	let newUser = yield User.create(user).catch(error => {
		this.throw(error.message, 400);
	});
	ctx.response.body = newUser;
	ctx.response.status = 200;
});

router.put('/users', function* (){
	let ctx = this;
	let id = ctx.request.body.id;
	let user = yield User.findById(id).exec();
	if(!user){
		ctx.response.status = 404;
		ctx.response.body = {
			error: "User not found"
		};
		return;
	}
	user.loc = ctx.request.body.loc;
	let savedUser = yield user.save();
	ctx.response.body = savedUser;
	ctx.response.status = 200;
});

router.delete('/users', function* (){
	let ctx = this;
	let victim = yield User.findById(ctx.request.body.victimId).exec();
	let killer = yield User.findById(ctx.request.body.killerId).exec();
	if(!victim || !killer){
		ctx.response.status = 404;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: "Victim or killer not found"
		};
		return;
	}
	if(victim.isDead){
		ctx.response.status = 400;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: "Victim already dead!"
		}
		return;
	}
	victim.killedBy = killer._id;
	victim.isDead = true;
	killer.killed.push(victim._id);
	let savedVictim = yield victim.save();
	let savedKiller = yield killer.save();
	ctx.response.body = {
		victim: savedVictim,
		killer: savedKiller
	};
	ctx.response.status = 200;
});

module.exports = router;