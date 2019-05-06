var express=require("express");
var router=express.Router({mergeParams:true});
var Slot = require("../models/slots");
var User = require("../models/users");
var middlewareObj= require("../middleware");

//slots index route
router.get("/slots",middlewareObj.isLoggedIn,function(req,res){
    
    //find all slots present in database
    Slot.find({}).sort({start:-1}).populate("bookings").exec(function(err,slotlist){
        if(!err){
            var dateToday=new Date();
            dateToday.setHours((dateToday.getUTCHours())+5);
            dateToday.setMinutes((dateToday.getUTCMinutes())+30);
            var dateTomorrow=new Date();
            dateTomorrow.setHours((dateTomorrow.getUTCHours())+5);
            dateTomorrow.setMinutes((dateTomorrow.getUTCMinutes())+30);
            dateTomorrow.setDate(dateTomorrow.getDate()+1)
            var dateDayAfter=new Date();
            dateDayAfter.setHours((dateDayAfter.getUTCHours())+5);
            dateDayAfter.setMinutes((dateDayAfter.getUTCMinutes())+30);
            dateDayAfter.setDate(dateDayAfter.getDate()+2);
            
            //find all slots booked for current year
            var slotscurrentyear=slotlist.filter(function(slotelem){
                return(slotelem.start.getFullYear()==dateToday.getFullYear());
                });//this needs to be passed on
            
            //filter out all slots booked for today
            var slotstoday=slotlist.filter(function(slotelem){
                    return (slotelem.date==dateToday.toLocaleDateString());
            });//this needs to be passed on
            
            //filter out all slots booked for the next day
            var slotstomorrow=slotlist.filter(function(slotelem){
                    return (slotelem.date==dateTomorrow.toLocaleDateString());
            });//this needs to be passed on
            
            //filter out all slots booked for day after the next
            var slotsdayafter=slotlist.filter(function(slotelem){
                    return (slotelem.date==dateDayAfter.toLocaleDateString());
            });//this needs to be passed on
            
            res.render("slots/index.ejs",{slotscurrentyear:slotscurrentyear,slotstoday:slotstoday,
                                            slotstomorrow:slotstomorrow, slotsdayafter:slotsdayafter,
                                            route:"slots", today:dateToday});
        }
        
        else if(err){
            req.flash("error",err.message);
            res.redirect("/slots");
        }
    });
    
    
});


//slots post route non-admin
router.post("/slots",middlewareObj.isLoggedIn, function(req,res){
    //create new date objexts to store slot timings
    var day=req.query.day;
    var slotstart=new Date();
    slotstart.setHours((slotstart.getUTCHours())+5);
    slotstart.setMinutes((slotstart.getUTCMinutes())+30);
    
    var slotend=new Date();
    slotend.setHours((slotstart.getUTCHours())+5);
    slotend.setMinutes((slotstart.getUTCMinutes())+30);
    
    slotstart.setHours(req.body.starttime.slice(0,2));
    slotstart.setMinutes(req.body.starttime.slice(3));
    slotend.setHours(req.body.endtime.slice(0,2));
    slotend.setMinutes(req.body.endtime.slice(3));
    
    

    //check if duration valid between 60-90 mintues
    //this also checks that endtime later than starttime
    var duration=(slotend-slotstart)/60000;
    if(duration>=60 && duration <=90){
        
         //change the day of the slot start and end accordingto day of booking
        if(day=="Tomorrow"){
            slotstart.setDate(slotstart.getDate()+1);
            slotend.setDate(slotend.getDate()+1);
        }
        else if(day!="Today"){
            slotstart.setDate(slotstart.getDate()+2);
            slotend.setDate(slotend.getDate()+2);
        }
        
        // create the slot object for insertion into db 
        
        var slotObj={
            creator: res.locals.currentUser.username,
            date : slotstart.toLocaleDateString(),
            start: slotstart,
            end: slotend,
            vacancies: 10
        }
        
        
        //Lookup slots on same day for time conflicts
        Slot.find({date:slotObj.date},function(err,slots){
            if(!err && slots.length==0){
                //no slots found, so we are good to push the info
                console.log("No prior slots for the day found");
                Slot.create(slotObj,function(err,slot){
                    if(!err){
                        console.log("New Slot for "+day+" has been pushed to db");
                        res.redirect("/slots/"+slot._id);
                    }
                });
            }
            
            else if(!err){
                console.log("Bookings for the same day found")
                var availability=true;
                //iterates through all slots on the same day and changes availability in case of conflict
                slots.forEach(function(slot){
                    var startDisplay = slot.start.getHours()+":"+(slot.start.getMinutes()<10?'0':'')+slot.start.getMinutes();
                    var endDisplay = slot.end.getHours()+":"+(slot.end.getMinutes()<10?'0':'')+slot.end.getMinutes();
                    //iterate through every slot
                    //redirect if slot clashes with desired new slot
                    if(slot.start==slotObj.start || slotObj.end==slot.end){
                        availability=false;
                        req.flash("error","Slot unavailable between "+startDisplay+" to " +endDisplay);
                    }
                    else if(slot.start<slotObj.start && slot.end>slotObj.start){
                        availability=false;
                        req.flash("error","Slot unavailable between "+startDisplay+" to " +endDisplay);
                    }
                    else if(slot.start<slotObj.end && slot.end>slotObj.end){
                        availability=false;
                        req.flash("error","Slot unavailable between "+startDisplay+" to " +endDisplay);
                    }
                    else if(slotObj.start<slot.start && slotObj.end>slot.end){
                        availability=false;
                        req.flash("error","Slot unavailable between "+startDisplay+" to " +endDisplay);
                    }
                    
                });
                if (availability){
                        //push the slot into database
                        Slot.create(slotObj,function(err,newslot){
                            if(!err){
                                var startDisplay = slotObj.start.getHours()+":"+(slotObj.start.getMinutes()<10?'0':'')+slotObj.start.getMinutes();
                                var endDisplay = slotObj.end.getHours()+":"+(slotObj.end.getMinutes()<10?'0':'')+slotObj.end.getMinutes();
                                console.log("New Slot for "+day+" has been pushed to db");
                                req.flash("success","Slot created from "+startDisplay+" to " +endDisplay);
                                res.redirect("/slots/"+newslot._id+"/bookings/new");
                            }
                        });
                }
                else{
                    res.redirect("/slots");
                }
                
            }
        });
    }
    
    else if(duration<0){
        //redirect with message : end time  should be after start time
        req.flash("error","End time  should be after Start time ");
        res.redirect("/slots");
        
    }
    
    else{
        //redirect with message : duration should be 60 - 90 minutes
        req.flash("error","Slot duraton should be between 60 and 90 minutes");
        res.redirect("/slots");
    }
});

//slots post route for admin
router.post("/slots/admin",middlewareObj.isLoggedIn,middlewareObj.isAdmin,function(req,res){
    
    //get the data from the ejs form
    var date = req.body.date;
    var starttime=req.body.starttime;
    var endtime=req.body.starttime;
    
    //create date objects for start and end times
    var start = new Date(date);
    var end = new Date(date);
    
    start.setHours(starttime.slice(0,2));
    start.setMinutes(starttime.slice(3));
    
    end.setHours(endtime.slice(0,2));
    end.setMinutes(endtime.slice(3));
    
    //prepare the slot object to insert into DB
    var slotObj={
            creator: res.locals.currentUser.username,
            date : start.toLocaleDateString(),
            start: start,
            end: end,
            vacancies: 10
        };
    //check whether slot end time is after start time
    var duration=(start-end)/60000;
    
    if(duration>0){
        //Lookup slots on same day for time conflicts
        Slot.find({date:start.toLocaleString()},function(err,slots){
            if(!err && slots.length==0){
                //no slots found, so we are good to push the info
                console.log("No prior slots for the day found");
                Slot.create(slotObj,function(err,slot){
                    if(!err){
                        console.log("New Slot for "+slot.start.toLocaleDateString()+" has been pushed to db");
                        res.redirect("/slots/"+slot._id);
                    }
                });
            }
            
            else if(!err){
                var availability=true;
                //iterates through all slots on the same day and changes availability in case of conflict
                slots.forEach(function(slot){
                    //iterate through every slot
                    //redirect if slot clashes with desired new slot
                    if(slot.start==slotObj.start || slotObj.end==slot.end){
                        availability=false;
                        req.flash("error","Slot unavailable from "+slot.start.toLocaleTimeString() + " to " + slot.end.toLocaleTimeString());
                    }
                    else if(slot.start<slotObj.start && slot.end>slotObj.start){
                        availability=false;
                        req.flash("error","Slot unavailable from "+slot.start.toLocaleTimeString() + " to " + slot.end.toLocaleTimeString());
                    }
                    else if(slot.start<slotObj.end && slot.end>slotObj.end){
                        availability=false;
                        req.flash("error","Slot unavailable from "+slot.start.toLocaleTimeString() + " to " + slot.end.toLocaleTimeString());
                    }
                    else if(slotObj.start<slot.start && slotObj.end>slot.end){
                        availability=false;
                        req.flash("error","Slot unavailable from "+slot.start.toLocaleTimeString() + " to " + slot.end.toLocaleTimeString());
                    }
                    
                });
                if (availability){
                        //push the slot into database
                        Slot.create(slotObj,function(err,newslot){
                            if(!err){
                                console.log("New Slot for has been pushed to db");
                                req.flash("success","Slot created from "+newslot.start.toLocaleTimeString()+ " to " + newslot.end.toLocaleTimeString());
                                res.redirect("/slots/"+newslot._id+"/bookings/new");
                            }
                        });
                }
                else{
                    res.redirect("/slots");
                }
            }
        });
        
    }
    
    else {
        //redirect with message : end time  should be after start time
        req.flash("error","End time  should be after Start time ");
        res.redirect("/slots");
    }
    
});

//===========New Slot Route==============

//this will render the form according to admin status and parameters
router.get("/slots/new",middlewareObj.isLoggedIn,function(req,res){
    //if user is admin render date customizable form
    if(res.locals.currentUser.username=="admin"){
      res.render("slots/newadmin",{route:"slots"})  
    }
    
    //if user not admin evaluate date to be sent for display to new ejs
    
    else{
        var date= new Date();
        date.setHours((date.getUTCHours())+5);
        date.setMinutes((date.getUTCMinutes())+30);
        var day="Today";
        if(req.query.day=="tomorrow"){
            date.setDate(date.getDate()+1);
            day="Tomorrow"
        }
        
        else if(req.query.day=="dayafter"){
            date.setDate(date.getDate()+2);
            var daysOfTheWeek = ["Sunday","Monday", "Tuesday","Wednesday","Thursday","Friday","Saturday"];
            day=daysOfTheWeek[date.getDay()];
        }
        
        
        //render form with non customizable date
        res.render("slots/new",{dateObj:date,day:day,route:"slots"});    
    }
    
});



//=========Show Slot Routes==============
router.get("/slots/:id",middlewareObj.isLoggedIn,function(req,res){
    
    var id= req.params.id;
    
    var user = req.session.passport.user;
    var bookingid=null;
    Slot.findById(id).populate("bookings").exec(function(err,slot){
        if(!err){
            var userBooked = false;
            slot.bookings.forEach(function(booking){
                if(booking.username==user){
                    userBooked=true;
                    bookingid=booking._id;
                }
            });
            console.log("Slot from show route"+slot);
            res.render("slots/show",{slot:slot,booked:userBooked,bookingid:bookingid,route:"slots"});    
        }
    });
});



//--------Slot Delete Route----------

router.delete("/slots/:id",middlewareObj.isLoggedIn,function(req,res){
    
    
        Slot.findById(req.params.id,function(err, slot) {
        if(!err){
            var now = new Date();
            now.setHours((now.getUTCHours())+5);
            now.setMinutes((now.getUTCMinutes())+30);
            
            //Check if slot dead(in the past). Do not delete dead slots
            if ((slot.start> now && req.user.username=="admin")||(slot.vacancies>9)){
                Slot.deleteOne(slot,function(err){
                    if(!err){
                        req.flash("success", "Slot Deleted Succesfully");
                        res.redirect("/slots");
                    }
                });
            }
            else if(slot.start< now){
                req.flash("error", "The slot is in the past");
                res.redirect("/slots/"+req.params.id);
            }
            else {
                req.flash("error", "You need to be an admin to delete a non empty slot");
                res.redirect("/slots/"+req.params.id);
            } 
        }
    
        else {
            req.flash("error", "You need to be an admin to do that");
            res.redirect("/slots/"+req.params.id);
        }
        
        });
    
});





//--------------currently not being accessed------

// router.get("slots/:id/edit",isLoggedIn,function(req,res){
//     //takes some info about the booking from the id and then renders a form for editing with some of the data passed along
//     res.render("");
// });



module.exports=router;

//clean this up further with functions for leap year checks and various validations

