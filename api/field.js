'use strict';

const User      = require('../models/user');
const _         = require('lodash');
const Geo       = require('./geo');
const Settings  = require('./game_settings');
const Game      = require('./game');

let newPlayer = function(user){
	return User.create(user);
}

let getAllPlayers = function(){
	return User.find({});
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
		return {
			user: result.obj,
			metersToUser: result.dis,
			directionToUser: bearing,
			bounty: bounty
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