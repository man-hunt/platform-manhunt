'use strict';

const _         = require('lodash');
const User      = require('../models/user');
const Geo       = require('./geo');
const Settings  = require('./game_settings');

let canAttack = function(player, target){
	if(!target || !player){
		return {
			status: 404,
			error: "Player or Target not found!"
		}
	}
	if(target.isDead){
		return {
			status: 400,
			error: "Target is already dead!"
		}
	}
	if(player.isDead){
		return {
			status: 400,
			error: "Player is dead and can't attack Target!"
		}
	}
	return {
		status: 200,
		error: false
	}
};

let processLockOn = function* (player, targets){
	let lockonTargets = _.sortBy(_.filter(targets, {canLockOn: true}), ['metersToUser']);
	
	if(player.target){
		//already had target, confirm target is still in range and check time
		let target = _.find(targets, function(target){
			return target.user.id === player.target.toString();
		});
		if(!target){
			//target is really far, > max_distance
			target = yield User.findById(player.target).exec();
			console.log("Target not in range anymore");
			let result = yield removeLockOn(player, target);
			return result;
		}
		if(target && target.canLockOn){
			//still in range, calculate lockon time
			let timeLockedOn = Date.now() - player.targetLockedOnAt;
			console.log("Target still in range", timeLockedOn);
			return {
				player,
				target,
				timeLockedOn
			}
		}else{
			//not in lockon-able anymore, remove lockon
			//target may be out of attack range, target could be dead, or target out of max_distance range
			console.log("Target not in range anymore");
			let result = yield removeLockOn(player, target.user);
			return result;
		}
	}else{
		//assign closest target to lockon
		if(lockonTargets.length > 0){
			let target = _.head(lockonTargets);
			console.log("Lockon to new Target");
			return yield addLockOn(player, target.user);
		}
	}
}

//process if the player is still locked-on by an attacker
let processEscape = function* (player, nearby){
	if(player.lockedOnBy){
		let attacker = _.find(nearby, function(attacker){
			return attacker.user.id === player.lockedOnBy.toString();
		});
		if(!attacker){
			//escape
			console.log("attacker no longer locked on");
			attacker = yield User.findById(player.lockedOnBy).exec();
			let result = yield removeLockOn(attacker, player);
			return result;
		}
		let bearing = Geo.getBearing(attacker.user.loc.coordinates, player.loc.coordinates);
		let isInRange = withinRange(attacker.metersToUser, attacker.user.dir, bearing);
		if(isInRange && (canAttack(attacker.user, player).status === 200)){
			//still locked-on
			let timeLockedOn = Date.now() - attacker.user.targetLockedOnAt;
			console.log("attacker still locked on", timeLockedOn);
		}else{
			//escape
			console.log("attacker no longer locked on");
			let result = yield removeLockOn(attacker.user, player);
			return result;
		}
	}
}

function* removeLockOn(player, target){
	target.lockedOnBy = null;
	target = yield target.save();
	player.target = null;
	player.targetLockedOnAt = null;
	player = yield player.save();
	return {target, player};
}

function* addLockOn(player, target){
	target.lockedOnBy = player.id;
	target = yield target.save();
	player.target = target.id;
	player.targetLockedOnAt = new Date();
	player = yield player.save();
	return {target, player};
}

let killTarget = function* (player, target){
	target.killedBy = player._id;
	target.isDead = true;
	target.killedAt = new Date();
	target.lockedOnBy = null;
	console.log("Victim: ", target);
	target = yield target.save();

	player.target = null;
	player.targetLockedOnAt = null;
	player.killed.push(target._id);
	player.credits += calcBounty(target);
	console.log("Killer: ", player);
	player = yield player.save();
	return {target, player};
}

let calcBounty = function(player){
	return (player.killed.length * Settings.BOUNTY_PER_KILL) + (timeAlive(player) * msToMinutes * Settings.BOUNTY_PER_MINUTE);
}

let newPlayer = function(user){
	return User.create(user);
}

let getAllPlayers = function* (){
	let users = yield User.find({});
	users = _.map(users, function(user){
		let bounty = calcBounty(user);
		user = user.toObject();
		user.bounty = bounty;
		return user;
	});
	return users;
}

let deleteAllPlayers = function(){
	return User.remove({}).exec();
}

let getPlayer = function(userid){
	return User.findById(userid).exec();
}

let getNearbyPlayers = function* (user){
	let results = yield User.geoNear(user.loc, { maxDistance : Settings.MAX_HUNT_DISTANCE, spherical : true })
	.catch(error => {
		this.throw(error.message, 400);
	});
	let targets = _.map(results, function(result){
		let bearing = Geo.getBearing(user.loc.coordinates, result.obj.loc.coordinates);
		let bounty = calcBounty(result.obj);
		let isInRange = withinRange(result.dis, user.dir, bearing);
		return {
			user: result.obj,
			metersToUser: result.dis,
			directionToUser: bearing,
			bounty: bounty,
			isInRange: isInRange,
			canLockOn: isInRange && (canAttack(user, result.obj).status === 200)
		};
	});
	targets = _.filter(targets, function(target) {
	  return target.user.id !== user.id;
	});
	return targets;
}

let updatePlayersState = function (user, loc){
	user.loc.coordinates.set(0, loc.long);
	user.loc.coordinates.set(1, loc.lat);
	user.dir = loc.dir;
	return user.save();
}

let withinRange = function(dist, direction, directionToTarget){
	direction = direction % 360;
	directionToTarget = directionToTarget % 360;
	let angle = deltaAngle(direction, directionToTarget);
	return (dist < Settings.ATTACK_DISTANCE_CLOSE && angle < Settings.ATTACK_ANGLE_CLOSE)
		|| (dist < Settings.ATTACK_DISTANCE       && angle < Settings.ATTACK_ANGLE);
}

function deltaAngle(alpha, beta){
	// http://stackoverflow.com/a/7571008
	let phi = Math.abs(beta - alpha) % 360; // This is either the distance or 360 - distance
    let distance = phi > 180 ? 360 - phi : phi;
    return distance;
}

module.exports = {
	canAttack,
	processLockOn,
	processEscape,
	killTarget,
	calcBounty,
	newPlayer,
	getAllPlayers,
	deleteAllPlayers,
	getPlayer,
	getNearbyPlayers,
	updatePlayersState,
	withinRange
}

let msToMinutes = 1 / (1000 * 60);
//minutes
function timeAlive(player){
	if(player.isDead){
		return (new Date(player.killedAt).getTime()) - new Date(player.createdAt).getTime();
	}
	return Date.now() - new Date(player.createdAt).getTime();
}