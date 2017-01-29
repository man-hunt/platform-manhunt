'use strict';

const User      = require('../models/user');
const _         = require('lodash');
const Geo       = require('./geo');
const Settings  = require('./game_settings');
const Game      = require('./game');

let newPlayer = function(user){
	return User.create(user);
}

let getAllPlayers = function* (){
	let users = yield User.find({});
	users = _.map(users, function(user){
		let bounty = Game.calcBounty(user);
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
	let users = _.map(results, function(result){
		let bearing = Geo.getBearing(user.loc.coordinates, result.obj.loc.coordinates);
		let bounty = Game.calcBounty(result.obj);
		let isInRange = withinRange(result.dis, user.dir, bearing);
		return {
			user: result.obj,
			metersToUser: result.dis,
			directionToUser: bearing,
			bounty: bounty,
			isInRange: isInRange,
			canLockOn: isInRange && (Game.canAttack(user, result.obj).status === 200)
		};
	});
	users = _.filter(users, function(test) {
	  return test.user.id !== user.id;
	});
	return users;
}

let updatePlayersState = function (user, loc){
	user.loc.coordinates.set(0, loc.long);
	user.loc.coordinates.set(1, loc.lat);
	user.dir = loc.dir;
	return user.save();
}

module.exports = {
	newPlayer,
	getAllPlayers,
	deleteAllPlayers,
	getPlayer,
	getNearbyPlayers,
	updatePlayersState
}

function withinRange(dist, direction, directionToTarget){
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