'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
	name: Schema.Types.String,
	ble: Schema.Types.String
}, {
  timestamps: true,
});

let User = mongoose.model('User', schema);

module.exports = User;
