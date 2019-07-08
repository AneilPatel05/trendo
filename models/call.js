var mongoose = require('mongoose');
var Promise = require('bluebird');
var Schema = mongoose.Schema;
var Callschema = new mongoose.Schema({
	block: {
    type: 'Number'
  },
  author: {
    type: 'String'
  },
  parent_author: {
    type: 'String'
  },
  parent_permlink: {
    type: 'String'
  },
  status: {
    type: 'String'
  },  
  permlink: {
    type: 'String'
  }         
},
{
  timestamps: true
});
var Call = mongoose.model('Call', Callschema);

Promise.promisifyAll(Call)
Promise.promisifyAll(Call.prototype)

exports.Call = Call