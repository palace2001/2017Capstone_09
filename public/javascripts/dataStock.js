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
    name: String,
    predict: Object,
    forecastPrice: Array,
    pastPrice: Array,
    accuracy: Number,
    preDate: Object,
    imagePath: String,
    description: String
});




module.exports = mongoose.model('stock', stockSchema);/**
 * Created by algorithm on 17. 5. 17.
 */
