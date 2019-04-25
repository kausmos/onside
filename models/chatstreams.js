const mongoose = require("mongoose");
const User=require("./users.js");
const Message=require("./messages.js");

var chatstreamSchema = new mongoose.Schema({ 
   
   sender: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User"
   },
   
   recipient: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User"
   },
   
    messageList :[{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Message"
   }],
   unread: Number
});

var Chatstream = mongoose.model("Chatstream",chatstreamSchema);
module.exports= Chatstream;