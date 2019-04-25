const mongoose=require("mongoose");
const User=require("./users.js");

var messageSchema = new mongoose.Schema({
    
    sender: {
            firstname:String,
            userid:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            }
    },
    
    recipient: {
        firstname:String,
        userid:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
        
    },
    
    content: String,
    
    
});

var Message = mongoose.model("Message",messageSchema);

module.exports= Message;