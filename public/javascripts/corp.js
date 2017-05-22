var mongoose = require('mongoose').connect('mongodb://localhost/stock_db');
mongoose.Promise = global.Promise;

// CONNECT TO MONGODB SERVER
var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server");
});


var Schema = mongoose.Schema;

// creates DB schema for stock
var stockSchema = mongoose.Schema({
    _id: String,
    stockName: String,
    forecastPrice: Array,
    pastPrice: Array,
    accuracy: Number,
    imagePath: String,
    description: String
});

// creates DB schema for stock
var corpSchema = mongoose.Schema({
    _id: String,
    market: String,
    name: String,
    lately_trade_data: Number
});



module.exports = mongoose.model('corps', corpSchema);/**
 * Created by algorithm on 17. 5. 17.
 */
