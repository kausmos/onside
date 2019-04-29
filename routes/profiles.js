var express=require("express");
var router=express.Router({mergeParams:true});
var Slot = require("../models/slots");
var Booking = require("../models/bookings");
var User = require("../models/users");
var Message = require("../models/messages");
var Chatstream = require("../models/chatstreams");
var middlewareObj= require("../middleware");

//---------my booked slots-------------------

router.get("/profiles/self/mybookings",middlewareObj.isLoggedIn,function(req,res){
  //find all slots in db
  Slot.find({}).populate("bookings").exec(function(err,slotlist){
     
     if(!err){
        
         
         
         //filter out slots bearing currentUser ID
         var myslots=[];
         myslots=slotlist.filter(function isMyBooking(slot){
             var isMySlot=false;
             slot.bookings.forEach(function(booking){
                 if (booking.username==res.locals.currentUser.username){
                     isMySlot=true;
                     return isMySlot;
                 }
             });
             return isMySlot;
             
         });
          console.log("myslots"+myslots);
         
            // var dateToday=new Date();
            // var datedayafter=new Date();
            // datedayafter.setDate(dateToday.getDate()+2);
            // var daysoftheweek =["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            // var dayafter=daysoftheweek[datedayafter.getDay()];//this needs to be passed on
            // var monthsofyear = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
            
            // var myslots=slotlist.filter(function(slotelem){
            //     slotelem.bookings.forEach(function(booking){
            //         if (booking.username==res.locals.currentUser){
            //             return true;
            //         }
            //     });
            // });//this needs to be passed on
            
            
            //divide myslots to past and upcoming bookings
            var pastslots=myslots.filter(function isPastSlot(slot){
                
                let now = new Date();
                return(slot.end<now);
                
                
            }); //passed on to ejs
            
            var upcomingslots=myslots.filter(function isUpcomingSlot(slot){
                
                let now = new Date();
                return(slot.start>now);
                
            }); //passed on to ejs
            
            var ongoingslots=myslots.filter(function isOngoingSlot(slot){
                
                let now = new Date();
                return((slot.start<now)&&(slot.end>now));
                
            }); //passed on to ejs
            
            console.log("upcoming slots in mybookings route:"+ upcomingslots);
        res.render("profiles/mybookings.ejs",{upcomingslots:upcomingslots,pastslots:pastslots,ongoingslots:ongoingslots,route:"profile"});
      }
  });
   
});

//Route to get detials from the new user after registration
router.get("/profiles/self/getdetails",middlewareObj.isLoggedIn,function(req,res){
    
    res.render("profiles/getdetails",{route:"profile"});
    
});


//profile edit route. accessed during edit or after registration
router.post("/profiles/self/getdetails",middlewareObj.isLoggedIn,function(req,res){
    
    //get profile details from user
    
    var positions=[];
    positions.push(req.body.positiona);
    positions.push(req.body.positionb);
    positions.push(req.body.positionc);
    
    var associations=req.body.associations.split(",");
    
    var favteams=req.body.favteams.split(",");
    
    var strongfoot=req.body.strongfoot;
    
    var hometown = req.body.hometown;
    
    
    //Look for the user model using user id
    console.log("Current User"+ res.locals.currentUser);
    User.findById(res.locals.currentUser._id, function(err,user){
        if(!err){
            //update information in the document
            user.positions=positions;
            user.associations=associations;
            user.favteams=favteams;
            user.strongfoot=strongfoot;
            user.hometown=hometown;
            
            user.save();
        }
        
    });
    
    
    //redirect to slots route after entering details into model
    res.redirect("/slots");
    
});




router.get("/profiles/self/show",middlewareObj.isLoggedIn,function(req,res){
    res.render("profiles/showself.ejs",{route:"profile"});
    
});

router.get("/profiles/other/:id",middlewareObj.isLoggedIn,function(req,res){
    
    if(req.params.id==res.locals.currentUser._id){
        res.redirect("/profiles/self/show");
    }
    
    else{
        User.findById(req.params.id,function(err,user){
            if(!err){
                res.render("profiles/showother.ejs",{user:user,route:"profile"});        
            }
            
        });
        
    }
    
});


module.exports=router;