var express=require("express");
var router=express.Router({mergeParams:true});
var Slot=require("../models/slots");
var Booking=require("../models/bookings");
const User = require("../models/users");
const passport = require("passport");
var middlewareObj= require("../middleware");
var socketList = require("../socketinfo.js");


var returnRouter = function(io,myEmitter){

    router.get("/", function(req,res){
        res.render("landing");
    });
    
    
    router.get("/login",function(req,res){
        if(req.isAuthenticated()){
            res.redirect("/slots");
        }
        res.render("login");
    });
    
    router.post("/login",function(req,res,next){
                             passport.authenticate('local', function(err, user, info) {
                            if (err) { return next(err); }
                            if (!user) { return res.redirect('/login'); }
                            req.logIn(user, function(err) {
                              if (err) { return next(err); }
                              myEmitter.emit("newuser",user.username);

                              return res.redirect('/slots');
                            });
                          })(req, res, next);
                            
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
    
    
    
    
    return router;
}


module.exports=returnRouter;