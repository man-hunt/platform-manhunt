'use strict';

const Router    = require('koa-router');
const User      = require('../models/user');
const _         = require('lodash');

const router = new Router();

const MAX_HUNT_DISTANCE = 1000; //meters

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

router.get('/users/:userid', function* (){
	let ctx = this;
	let user = yield User.findById(ctx.params.userid).exec();
	if(!user){
		ctx.response.status = 404;
		ctx.response.body = {
			error: "User not found"
		};
		return;
	}
	let results = yield User.geoNear(user.loc, { maxDistance : MAX_HUNT_DISTANCE, spherical : true })
	.catch(error => {
		this.throw(error.message, 400);
	});
	let users = _.map(results, function(result){
		let bearing = calculateDirection(user.loc.coordinates, result.obj.loc.coordinates);
		return {
			user: result.obj,
			metersToUser: result.dis,
			directionToUser: bearing
		};
	});
	users = _.filter(users, function(test) {
	  return test.user.id !== user.id;
	});
	ctx.response.body = {
		user: user,
		nearby: users
	}
	ctx.response.status = 200;
});

const pi4 = Math.PI/4;

const radToDeg = (180 / Math.PI);

// pt = [long, lat] (GeoJSON Point).coordinates
function calculateDirection(pta, ptb){
	// Δφ = ln( tan( latB / 2 + π / 4 ) / tan( latA / 2 + π / 4) ) 
	// Δlon = abs( lonA - lonB ) 
	// bearing :  θ = atan2( Δlon ,  Δφ ) 
	pta = [pta[0]/radToDeg, pta[1]/radToDeg];
	ptb = [ptb[0]/radToDeg, ptb[1]/radToDeg];
	let dPhi = Math.log( Math.tan(ptb[1]/2 + pi4) /  Math.tan(pta[1]/2 + pi4) );
	let dLong = Math.abs(pta[0] - ptb[0]);
	if(dLong > 180)
		dLong = dLong % 180;
	let bearing = Math.atan2(dLong, dPhi) * radToDeg;
	return (bearing + 360) % 360;
}

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
	if(user.isDead){
		ctx.response.status = 400;
		ctx.response.body = {
			user: user,
			error: "User is dead and can't update location!"
		}
		return;
	}
	user.loc.coordinates.set(0, ctx.request.body.loc.long);
	user.loc.coordinates.set(1, ctx.request.body.loc.lat);
	user.dir = ctx.request.body.loc.dir;
	let savedUser = yield user.save();
	ctx.response.body = savedUser;
	ctx.response.status = 200;
});

router.delete('/users', function* (){
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
	let victim = yield User.findById(ctx.request.body.victimId).exec();
	let killer = yield User.findById(ctx.request.body.killerId).exec();
	if(!victim || !killer){
		ctx.response.status = 404;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: "Victim or killer not found!"
		};
		return;
	}
	if(victim.isDead){
		ctx.response.status = 400;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: "Victim is already dead!"
		}
		return;
	}
	if(killer.isDead){
		ctx.response.status = 400;
		ctx.response.body = {
			victim: victim,
			killer: killer,
			error: "Killer is dead and can't kill victim!"
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

router.delete('/admin/users', function* (){
	let ctx = this;
	let deleted = yield User.remove({}).exec();
	ctx.response.body = deleted;
	ctx.response.status = 200;
});

module.exports = router;