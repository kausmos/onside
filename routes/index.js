var express=require("express");
var router=express.Router({mergeParams:true});
var Slot=require("../models/slots");
var Booking=require("../models/bookings");
const User = require("../models/users");

const passport = require("passport");

router.get("/", function(req,res){
    res.render("landing");
});


router.get("/login",function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/slots");
    }
    res.render("login");
});

router.post("/login",passport.authenticate("local",{
                        successRedirect:"/slots",
                        failureRedirect:"/login"
                    }),function(req,res){
                        User.findOne({username:req.session.passport.user},function(err,user){
                            if(!err){
                                req.flash("success","Welcome. You are logged in as "+user.firstname);
                                req.session.user=user;
                            }
                        });
                        
                    });
    
    


router.get("/signup",function(req,res){
    if (req.isAuthenticated()){
        res.redirect("/slots");
    }
    res.render("signup");
});

router.post("/signup",function(req,res){
    
    var username=req.body.username;
    var firstname=req.body.firstname;
    var lastname = req.body.lastname;
    var password=req.body.password;
    
    User.register(new User({username:username,firstname:firstname,lastname:lastname}),password,function(err,user){
       if(!err){
           passport.authenticate("local")(req,res,function(){
                req.flash("success","Welcome, "+firstname+". you have been registered");
                res.redirect("/slots");
           });
       }
       else{
           console.log("Signup err:"+err.message);
           req.flash("error",err.message);
           res.redirect("/signup");
       }
    });
});

router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out")
    res.redirect("/");
})


function getFirstName(username){
    User.find({username:username},function(err,user){
        if(!err){
            return user.firstname;
        }
    });
    return null;
}

module.exports=router;