'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
	name: Schema.Types.String,
	ble: Schema.Types.String,
	loc: {
		'type': {
			type: Schema.Types.String, 
			enum: "Point", 
			default: "Point"
		}, 
		coordinates: { 
			type: [Schema.Types.Number],   
			default: [0,0]
		} 
	},
	dir: {type: Schema.Types.Number, default: 0.0},
	isDead: {type: Schema.Types.Boolean, default: false},
	killedBy: Schema.Types.ObjectId,
	killed: [Schema.Types.ObjectId],
	credits: {type: Schema.Types.Number, default: 0},
	killedAt: Schema.Types.Date,
	target: Schema.Types.ObjectId,
	targetLockedOnAt: Schema.Types.Date,
	lockedOnBy: Schema.Types.ObjectId
}, {
  timestamps: true,
});
schema.index({loc: '2dsphere'});
schema.pre('save', function (next) {
  if (this.isNew && Array.isArray(this.loc) && 0 === this.loc.length) {
    this.loc = undefined;
  }
  next();
});

let User = mongoose.model('User', schema);

module.exports = User;
