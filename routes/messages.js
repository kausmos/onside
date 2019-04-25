var express=require("express");
var router=express.Router({mergeParams:true});
var Slot = require("../models/slots");
var Booking = require("../models/bookings");
var User = require("../models/users");
var Message = require("../models/messages");
var Chatstream = require("../models/chatstreams");
const mongoose= require("mongoose");


var returnRouter = function(io){

//messages index route

router.get("/messages",isLoggedIn,function(req,res){
   console.log("Inside messages index route");
   console.log(res.locals.currentUser._id);
   var relevantstreams=[];
   Chatstream.find({sender:res.locals.currentUser}).populate("sender")
                                                    .populate("recipient")
                                                    .populate("messageList")
                                                    .exec(function(err,streama){
       if(!err){
           relevantstreams=relevantstreams.concat(streama);
           Chatstream.find({recipient:res.locals.currentUser}).populate("sender")
                                                    .populate("recipient")
                                                    .populate("messageList")
                                                    .exec(function(err,streamb){
                if(!err){
                relevantstreams=relevantstreams.concat(streamb);        
                res.render("messages/index.ejs", {relevantstreams:relevantstreams,route:"messages"});
                    
                }   
           
            });
       }
   });
   
       
});

//messages new route - determine whether new form goes to edit or post
router.get("/messages/new/:id",isLoggedIn,function(req,res){
    
    //check if the other user is a sender of messages
    Chatstream.find({sender:req.params.id, recipient:res.locals.currentUser._id},function(err,streama){
       if(!err){
        //if conversation found, then proceed to it's show route
        if(streama.length>0){
            //REDIRECT TO SHOW CHATSTREAM
            res.redirect("/messages/"+streama[0]._id);
            // User.findById(req.params.id,function(err,user){
            //                 if(!err){
            //                     res.render("messages/new",{suffix:"?_method=PUT",user:user});//render new form with edit route link
            //                 }
            //             });
        }
        else {
            //check if the other user is a recipient of previous conversation
            Chatstream.find({sender:res.locals.currentUser._id,recipient:req.params.id},function(err,streamb){
                if(!err){
                    
                    //if conversation found, proceed to new message ejs
                    if(streamb.length>0){
                        //REDIRECT TO SHOW CHATSTREAM
                        res.redirect("/messages/"+streamb[0]._id);
                        // User.findById(req.params.id,function(err,user){
                        //     if(!err){
                        //         res.render("messages/new",{suffix:"?_method=PUT",user:user});//render new form with edit route link
                        //     }
                        // });
                    }
                    
                    //if no conversations found between other user and current user
                    else{
                        // find details of the other user in DB and pass it on to new ejs
                        User.findById(req.params.id,function(err,user){
                            if(!err){
                                res.render("messages/new",{suffix:"", user:user,route:"messages"}); //render new form with post route link        
                            }
                        });
                        
                    }
                    
                }
                
            });
            
        }
        }
    });
    
});


//messages post route
router.post("/messages/:id",isLoggedIn,function(req,res){
    console.log("Inside Messages post route");
    var newMessage = {
        content: req.body.content,
        sender:{firstname: res.locals.currentUser.firstname},
        recipient:{firstname: req.params.id}
    };
    
    var newChatstream ={
        
        sender:res.locals.currentUser._id,
        recipient: req.params.id,
        messageList:[]
    };
    
    Message.create(newMessage,function(err, message){
        if(!err){
            message.sender.userid=res.locals.currentUser._id;
            message.recipient.userid=req.params.id;
            message.save();
            console.log("Message created"+message);
           Chatstream.create(newChatstream,function(err,stream){
               if(!err){
                   console.log("Chatstream created"+stream);
                   stream.messageList.push(message);
                   stream.save();
                   console.log("Message pushed into chatstream and saved"+stream);
                   //redirect to show chatstream
                   res.redirect("/messages/"+stream._id);
               }
           }); 
        }
    });
    
});

//messages put route
router.put("/messages/:id",isLoggedIn,function(req,res){
    console.log("Inside PUT route");
    //create message template to be pushed to DB from form data
    var newMessage = {
        content: req.body.content,
        sender:{firstname: res.locals.currentUser.firstname},
        recipient:{firstname: req.params.id}
    };
    console.log("New message template:"+ newMessage);
    //create message in DB using the created template
    Message.create(newMessage,function(err, message){
        if(!err){
            message.sender.userid=res.locals.currentUser._id;
            message.recipient.userid=req.params.id;
            message.save();
            console.log("New Message created:"+message);
            //find chatstream between user and current user and push message into it
            
           Chatstream.find({sender: mongoose.Types.ObjectId(req.params.id),
                            recipient: mongoose.Types.ObjectId(res.locals.currentUser._id)},
                            function(err,streama){
                
               if(!err && streama.length>0){
                   streama[0].messageList.push(message);
                   streama[0].save();
                   //we are using socket here to utilize webSockets to show our messages in realtime
                   io.emit('newMessage', message);
                   console.log("inside chatstream a block");
                   //redirect to show chatstream
                   res.redirect("/messages/"+streama[0]._id);
               }
               
               else if(streama.length<=0){
                   Chatstream.find({recipient: mongoose.Types.ObjectId(req.params.id),
                                    sender: mongoose.Types.ObjectId(res.locals.currentUser._id)},
                                    function(err,streamb){
                       if(!err && streamb.length>0){
                        streamb[0].messageList.push(message);
                        streamb[0].save();
                        //we are using socket here to utilize webSockets to show our messages in realtime
                        //first we check whether current user is involved in the message
                        
                        
                        console.log("inside stream b block");
                        res.redirect("/messages/"+streamb[0]._id);
                    }
                    });
               }
                
           }); 
        }
    });
    
});


//messages show route
router.get("/messages/:streamid",isLoggedIn,function(req,res){
    
    Chatstream.findById(req.params.streamid)
    .populate("recipient")
    .populate("sender")
    .populate({path:"messageList",
                populate:"sender"
    })
    .exec(function(err,stream){
       if(!err){
        
        var userid1=stream.sender._id;
        var userid2=stream.recipient._id;
        console.log("--------------------------");
        console.log("equality checks");
        console.log("typeof stream.sender._id:"+typeof(stream.sender._id));
        
        console.log("typeof res.locals.currentUser._id:"+typeof(res.locals.currentUser._id));
        console.log("req.params.id:"+req.params.id);
        console.log("--------------------------");
        var user={};
        if(stream.sender._id.toString()==res.locals.currentUser._id.toString()){
            user._id=stream.recipient._id;
            user.firstname=stream.recipient.firstname;
        }
        else{
            user._id=stream.sender._id;
            user.firstname=stream.sender.firstname;
        }
        
        console.log("User object"+user);
        res.render("messages/show",{chatstream:stream, user:user, suffix:"?_method=PUT",route:"messages"});       
       } 
    });
    
});



function isLoggedIn(req,res,next){
    if (req.isAuthenticated()){
        next();
    }
    else{
        req.flash("error","You need to be logged in to do that!");
        res.redirect("/login");
    }
}

    return router;
};

module.exports= returnRouter;