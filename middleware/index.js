var Slot= require("../models/slots.js");
const User=require("../models/users.js");
var middlewareObj = {};

middlewareObj.isLoggedIn =function (req,res,next){
    if (req.isAuthenticated()){
        next();
    }
    else{
        req.flash("error","You need to be logged in to do that")
        res.redirect("/login");
    }
}

middlewareObj.notAlreadyBooked= function(req,res,next){
    var loggedInUser=res.locals.currentUser.username;
    var slotid=req.params.id;
    Slot.findById(slotid).populate("bookings").exec(function(err,slot){
        if(!err){
            slot.bookings.forEach(function checkUserInBookings(booking){
                if(booking.username==loggedInUser){
                    req.flash("error","Sorry, you can book a slot only once.")
                    res.redirect("/slots/"+slotid);
                }
            });
        }
    });
    next();
}


middlewareObj.getFirstName= function(username){
        User.find({username:username},function(err,user){
            if(!err){
                return user.firstname;
            }
        });
        return null;
}

middlewareObj.isAdmin=function(req,res,next){
    if (res.locals.currentUser.username=="admin"){
        next();
    }
    else{
        req.flash("error","You need to be the admin to do that!")
        res.redirect("/slots")
    }
}



module.exports = middlewareObj;