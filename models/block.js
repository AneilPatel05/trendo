var mongoose = require('mongoose');
var Promise = require('bluebird');
var Schema = mongoose.Schema;
var Blockschema = new mongoose.Schema({
	blockNum: {
		type: 'Number'
	}
},
{
  timestamps: true
});
var Block = mongoose.model('Block', Blockschema);

Promise.promisifyAll(Block)
Promise.promisifyAll(Block.prototype)

exports.Block = Block