'use strict';

const Game      = require('./game');

module.exports.getAllPlayers = function* (){
	let ctx = this;
	let users = yield Game.getAllPlayers();
	ctx.response.body = {
		users: users
	}
	ctx.response.status = 200;
};

module.exports.getPlayer = function* (){
	let ctx = this;
	let user = yield Game.getPlayer(ctx.params.userid);
	if(!user){
		ctx.response.status = 404;
		ctx.response.body = {
			error: "User not found"
		};
		return;
	}
	let nearbyPlayers = yield Game.getNearbyPlayers(user);
	let handledLockon = yield Game.processLockOn(user, nearbyPlayers);
	let handledEscape = yield Game.processEscape(user, nearbyPlayers);
	ctx.response.body = {
		user: user,
		nearby: nearbyPlayers
	}
	ctx.response.status = 200;
};

module.exports.createPlayer = function* (){
	let ctx = this;
	let newUser = yield Game.newPlayer(ctx.request.body)
	.catch(error => {
		this.throw(error.message, 400);
	});
	ctx.response.body = newUser;
	ctx.response.status = 200;
};

module.exports.updatePlayer = function* (){
	let ctx = this;
	let user = yield Game.getPlayer(ctx.request.body.id);
	if(!user){
		ctx.response.status = 404;
		ctx.response.body = {
			error: "User not found"
		};
		return;
	}
	if(user.isDead){
		ctx.response.status = 400;
		ctx.response.body = {
			user: user,
			error: "User is dead and can't update location!"
		}
		return;
	}
	let savedUser = yield Game.updatePlayersState(user, ctx.request.body.loc);
	ctx.response.body = savedUser;
	ctx.response.status = 200;
};

module.exports.attackPlayer = function* (){
	let ctx = this;
	if(ctx.request.body.victimId === ctx.request.body.killerId){
		ctx.response.status = 400;
		ctx.response.body = {
			victim: ctx.request.body.victimId,
			killer: ctx.request.body.killerId,
			error: "Can not kill self!"
		};
		return;
	}
	let victim = yield Game.getPlayer(ctx.request.body.victimId);
	let killer = yield Game.getPlayer(ctx.request.body.killerId);
	let canAttack = Game.canAttack(killer, victim);
	if(canAttack.error){
		ctx.response.status = canAttack.status;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: canAttack.error
		}
		return;
	}
	let savedVictim = yield Game.killTarget(killer, victim);
	let savedKiller = yield Game.awardKill(killer, victim);
	ctx.response.body = {
		victim: savedVictim,
		killer: savedKiller
	};
	ctx.response.status = 200;
};