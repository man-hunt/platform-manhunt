'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
	name: Schema.Types.String,
	ble: Schema.Types.String,
	loc: {
		lat: Schema.Types.Number,
		long: Schema.Types.Number,
		dir: Schema.Types.Number
	},
	isDead: Schema.Types.Boolean,
	killedBy: Schema.Types.ObjectId,
	killed: [Schema.Types.ObjectId]
}, {
  timestamps: true,
});

let User = mongoose.model('User', schema);

module.exports = User;
