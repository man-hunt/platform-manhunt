'use strict';

const _         = require('lodash');
const User      = require('../models/user');
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

let lockOn = function(player, target){

}

let attack = function(player, target){

}

let killTarget = function(player, target){
	target.killedBy = player._id;
	target.isDead = true;
	target.killedAt = new Date();
	console.log("Victim: ", target);
	return target.save();
}

let awardKill = function(player, victim){
	player.killed.push(victim._id);
	player.credits += calcBounty(victim);
	console.log("Killer: ", player);
	return player.save();
}

let calcBounty = function(player){
	return (player.killed.length * Settings.BOUNTY_PER_KILL) + (timeAlive(player) * msToMinutes * Settings.BOUNTY_PER_MINUTE);
}

module.exports = {
	canAttack,
	lockOn,
	attack,
	killTarget,
	awardKill,
	calcBounty
}

let msToMinutes = 1 / (1000 * 60);
//minutes
function timeAlive(player){
	if(player.isDead){
		return (new Date(player.killedAt).getTime()) - new Date(player.createdAt).getTime();
	}
	return Date.now() - new Date(player.createdAt).getTime();
}