var express=require("express");
var router=express.Router({mergeParams:true});
var Slot = require("../models/slots");
var Booking = require("../models/bookings");
var User = require("../models/users");
var Message = require("../models/messages");
var Chatstream = require("../models/chatstreams");
const mongoose= require("mongoose");
var middlewareObj= require("../middleware");

var returnRouter = function(io){

//messages index route

router.get("/messages",middlewareObj.isLoggedIn,function(req,res){
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
router.get("/messages/new/:id",middlewareObj.isLoggedIn,function(req,res){
    
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
router.post("/messages/:id",middlewareObj.isLoggedIn,function(req,res){
    console.log("Inside Messages post route");
    
    //if message made of whitespaces. do not push to db return to chatstream
    if(req.body.content.trim().length<1){
        res.redirect("/messages/new/"+req.params.id);
    }
    else{
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
                       stream.markModified("messageList");
                       stream.save()
                       stream.unread= stream.unread?stream.unread+1:1;
                       stream.markModified("unread")
                       stream.save();
                       User.findById(req.params.id,function(err, user) {
                            if(!err){
                                if(user.messages){
                                    user.messages.unread=user.messages.unread+1;
                                    user.save();
                                }
                                else{
                                    user.messages={unread:1};
                                    user.save();
                                }
                               
                                
                            } 
                       })
                       console.log("Message pushed into chatstream and saved"+stream);
                       //redirect to show chatstream
                       res.redirect("/messages/"+stream._id);
                   }
               }); 
            }
        });
    }
    
    
});

//messages put route
router.put("/messages/:id",middlewareObj.isLoggedIn,function(req,res){
    console.log("Inside PUT route");
    
    //create message template to be pushed to DB from form data
    var newMessage = {
        content: req.body.content,
        sender:{firstname: res.locals.currentUser.firstname},
        recipient:{userid: req.params.id}
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
                   
                   if(message.content.trim().length>0){
                        streama[0].messageList.push(message);
                        streama[0].markModified("messageList");
                        streama[0].save();
                        streama[0].unread= streama[0].unread?streama[0].unread+1:1;
                        streama[0].markModified("unread");
                        streama[0].save();
                   //update the user unread message paramter
                   //use sockets
                        User.findById(req.params.id,function(err,user){
                            if(!err){
                                if(user.messages){
                                    user.messages.unread=user.messages.unread+1;
                                    user.save();    
                                }
                                else{
                                    console.log("Attempting to create a user.messages");
                                    user.messages={unread:1};
                                    user.save();
                                    console.log("After supposed creation, user.messages is"+user.messages);
                                }
                                console.log("pushing to"+user.socketid);
                                io.on('connection', function(socket){
                                  socket.on('newmessage',function(msg){
                                      io.to(user.socketid).emit('newmessage', message);
                                  })
                                });
                            }
                        });
                   }
                   
                   //redirect to show chatstream
                   res.redirect("/messages/"+streama[0]._id);
               }
               
               else if(streama.length<=0){
                   Chatstream.find({recipient: mongoose.Types.ObjectId(req.params.id),
                                    sender: mongoose.Types.ObjectId(res.locals.currentUser._id)},
                                    function(err,streamb){
                       if(!err && streamb.length>0){
                           
                        if(message.content.trim().length>0){
                            streamb[0].messageList.push(message);
                            streamb[0].markModified("messageList");
                            streamb[0].save();
                            streamb[0].unread=streamb[0].unread ? streamb[0].unread+1 : 1;
                            streamb[0].markModified("unread");
                            streamb[0].save();
                        //update user unread parameter after pushing new message
                        User.findById(req.params.id,function(err,user){
                            if(!err){
                                if(user.messages){
                                    user.messages.unread=user.messages.unread+1;
                                    user.save();    
                                }
                                else{
                                    console.log("Attempting to create a user.messages");
                                    user.messages={unread:1};
                                    user.save();
                                    console.log("After supposed creation, user.messages is"+user.messages);
                                }
                                
                                console.log("pushing to"+user.socketid);
                                io.on('connection', function(socket){
                                  socket.on('newmessage',function(msg){
                                      io.to(user.socketid).emit('newmessage', message);
                                  })
                                });
                            }
                        })
                        }
                        else{
                            message.delete();
                        }
                        res.redirect("/messages/"+streamb[0]._id);
                    }
                    });
               }
           }); 
        }
    });
});


//messages show route
router.get("/messages/:streamid",middlewareObj.isLoggedIn,function(req,res){
    
    Chatstream.findById(req.params.streamid)
    .populate("recipient")
    .populate("sender")
    .populate({path:"messageList",
                populate:"sender"
    })
    .exec(function(err,stream){
       if(!err){
        
        //when chatstream found, make currentuser unread message count to 0
        User.findById(res.locals.currentUser._id, function(err, user) {
            if(!err){
                
                  //collect details for the other participant to be displayed
                            function getOtherUser(){
                                var seconduser={};
                                if(stream.sender._id.toString()==res.locals.currentUser._id.toString()){
                                    seconduser._id=stream.recipient._id;
                                    seconduser.firstname=stream.recipient.firstname;
                                }
                                else{
                                    seconduser._id=stream.sender._id;
                                    seconduser.firstname=stream.sender.firstname;
                                }
                                
                                console.log("User object"+seconduser);
                                res.render("messages/show",{chatstream:stream, user:seconduser, suffix:"?_method=PUT",route:"messages"});
                            }
                
                if(!(stream.messageList.slice(-1)[0].sender.userid.equals(res.locals.currentUser._id))){
                    
                    console.log("non sender checks");
                    console.log("user object messages"+user.messages);
                    
                    //check is required to handle previous accounts which did not have messages.unread in the user model
                    if(user.messages.unread){
                        console.log("user.messages exists");
                        user.messages.unread = user.messages.unread - stream.unread;
                        if (user.messages.unread<0){
                            user.messages.unread=0;
                        }
                        user.markModified("messages.unread");
                        user.save(function(err,user){
                            if(!err){
                                res.locals.currentUser.messages.unread=user.messages.unread;
                                stream.unread=0;
                                stream.save();
                                getOtherUser();
                            }
                        });    
                    }
                    else{
                        user.messages={unread:0};
                        res.locals.currentUser.messages.unread=user.messages.unread
                        user.save();
                        stream.unread=0;
                        stream.save();
                        getOtherUser();
                    }
                   
                }
                
                else{
                    console.log("sender checks");
                    getOtherUser();
                }
                
                
               
                
                
                
                
            }
        });
        
               
       } 
    });
    
});




    return router;
};

module.exports= returnRouter;