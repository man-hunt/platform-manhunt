'use strict';

const Router    = require('koa-router');
const Logic     = require('./logic');
const Game      = require('./game');

const router = new Router();

router.get('/users', Logic.getAllPlayers);
router.get('/users/:userid', Logic.getPlayer);
router.post('/users', Logic.createPlayer);
router.put('/users', Logic.updatePlayer);
router.delete('/users', Logic.attackPlayer);

router.delete('/admin/users', function* (){
	let ctx = this;
	let deleted = yield Game.deleteAllPlayers();
	ctx.response.body = deleted;
	ctx.response.status = 200;
});

module.exports = router;