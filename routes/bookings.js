var express=require("express");
var router=express.Router({mergeParams:true});
var Slot = require("../models/slots");
var Booking = require("../models/bookings");
var User = require("../models/users");
var middlewareObj= require("../middleware");

//-----------Bookings new route--------

router.get("/slots/:id/bookings/new",middlewareObj.isLoggedIn,function(req,res){
    
    var id=req.params.id;
    Slot.findById(id,function(err,slot){
        if(!err){
            res.render("bookings/new",{slot:slot,loggedin:req.isAuthenticated(),route:"slots"});
        }
    });
    
});

//----Bookings new post route--------

router.post("/slots/:id/bookings",middlewareObj.isLoggedIn,middlewareObj.notAlreadyBooked,function(req,res){
   console.log("Inside booking post route");
   var now = new Date();
    now.setHours((now.getUTCHours())+5);
    now.setMinutes((now.getUTCMinutes())+30);
   var slotID=req.params.id;
   var comp=req.body.companions;
   console.log("companions:"+comp+" type:"+typeof(comp));
   var companions = parseInt(comp);
   var bookingObj={
       userid: res.locals.currentUser,
       username: res.locals.currentUser.username,
       firstname: res.locals.currentUser.firstname,
       companions: companions
   };
   
    Booking.create(bookingObj, function(err,booking){
       if(!err){
           console.log("Token booking object created");
           Slot.findById(slotID,function(err,slot){
            //check that the slot is not dead(in the past)
            
            if(slot.start>now){
               
               if(!err && slot.vacancies>(bookingObj.companions)){
                    slot.bookings.push(booking);
                    console.log("Token booking object pushed to respective slot object");
                    slot.vacancies=slot.vacancies-(booking.companions+1);
                    console.log("Slot object vacancies changed according to new user booking");
                    slot.save();
                    console.log("Slot saved in DB inclusion of booking");
                    req.flash("success","Booking done");
                    res.redirect("/slots");
               }
               else if(!err && slot.vacancies<(bookingObj.companions)){
                   console.log("error: "+err);
                   req.flash("error","Sorry, your booking request exceeds the number of vacancies for the slot");
                   res.redirect("/slots/"+slotID);
               }
               else{
                   req.flash("error",err.message);
                   res.redirect("/slots"+slotID);
               }
               
            }
            
            else{
                //remove the booking object as slot was dead in which we wanted to push it
                Booking.deleteOne(booking,function(err){
                    if(!!err){
                        req.flash("error","Sorry, the slot you want to book is no longer active");
                        res.redirect("/slots/"+req.params.id);
                    }
                })
            }
            
           });
       }
       else{
           req.flash("error",err.message);
           res.redirect("/slots/"+req.params.id);
       }
   });
    
});

//----Bookings Delete Route---------

router.delete("/slots/:id/bookings/:bid",middlewareObj.isLoggedIn,function(req,res){
    var slotid=req.params.id;
    var bid=req.params.bid;
    var now = new Date();
    now.setHours((now.getUTCHours())+5);
    now.setMinutes((now.getUTCMinutes())+30);
    
    Slot.findById(slotid,function(err,slot){
        if(!err){
            Booking.findById(bid,function(err,booking){
                if(!err){
                    //Check if the booking is done by current user
                    //Check whether the slot is yet to be dead(in the past)
                    if((booking.username==res.locals.currentUser.username)&&(slot.start>now)){
                        slot.bookings.forEach(function(item,index){
                         if(item._id.equals(booking._id)){
                            slot.bookings.splice(index,1);
                            var newvacancies=0;
                            Booking.findById(booking._id,function(err,foundbooking){
                                if(!err){
                                    newvacancies=foundbooking.companions+1;
                                }
                            });
                            Booking.deleteOne(booking,function(err){
                                if(!err){
                                    slot.vacancies=slot.vacancies+newvacancies;
                                    slot.save();
                                    req.flash("success","Booking Cancelled Succesfully");
                                    res.redirect("/slots");
                                }
                            });
                         }
                        });    
                    }
                    
                    else{
                        req.flash("error","This slot was in the past and cannot be altered");
                        res.redirect("/slots/"+req.params.id);
                        res.redirect("/slots/"+slotid);
                    }
                    
                }
                else if(err){
                    req.flash("error",err.message);
                    res.redirect("/slots/:id")
                }
            });
        }
        else if(err){
            req.flash("error",err.message);
            res.redirect("/slots/:id")
        }
    });
});


module.exports=router;