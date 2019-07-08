const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
//const uri = process.env.MONGODB_URI
const uri = process.env.MONGODB_URI||'mongodb://trendo:trendoAdmin1@ds249017.mlab.com:49017/heroku_2ckfqg92'


const db = mongoose.connect(uri);
const client =  db.connection;
module.exports = client;
