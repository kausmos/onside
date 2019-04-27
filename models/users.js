const mongoose= require("mongoose");
var passportlocalmong=require("passport-local-mongoose");
var userSchema= new mongoose.Schema({
    
    username: String,
    firstname: String,
    lastname: String,
    password: String,
    positions:[String],
    associations: [String],
    favteams:[String],
    strongfoot: String,
    hometown: String,
    socket:String
    
});

userSchema.plugin(passportlocalmong);

var User = mongoose.model("User", userSchema);

module.exports = User;