var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
mongoose.Promise = global.Promise;

// CONNECT TO MONGODB SERVER
var db = mongoose.connection;

db.on('error', console.error);
db.once('open', function(){
    // CONNECTED TO MONGODB SERVER
    console.log("Connected to mongod server");
});


var userSchema = mongoose.Schema({
    name: String,
    email: String,
    interested: Array
});
// //password를 암호화
// userSchema.methods.generateHash = function(password) {
//     return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
// };
// //password의 유효성 검증
// userSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.local.password);
// };



module.exports = mongoose.model('accounts', userSchema);