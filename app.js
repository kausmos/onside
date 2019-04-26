//Our Main app goes here
//Onside project starts today alongside learning processes

//----------Loading dependencies (Mostly require statements)-------------
const express = require("express");
const app =express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const bodyParser= require("body-parser");
const mongoose= require("mongoose");
const seedDB=require("./seedDB");
const Slot=require("./models/slots.js");
const Booking=require("./models/bookings.js");
const User=require("./models/users.js");
const Message=require("./models/messages.js");
const Chatstream=require("./models/chatstreams.js");
const methodOverride=require("method-override");
const indexRoutes=require("./routes/index");
const bookingRoutes=require("./routes/bookings");
const slotRoutes=require("./routes/slots");
const profileRoutes=require("./routes/profiles");
const messageRoutes=require("./routes/messages")(io);
const passport=require("passport");
const localStrategy=require("passport-local");
const flash=require("connect-flash");
//----------------------------------------------------------------------


///-----------Database seeding module------------
// seedDB();

app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use(require ("express-session")({
    secret: "Random key here",
    resave: false,
    saveUninitialized:false
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use(bookingRoutes);
app.use(slotRoutes);
app.use(profileRoutes);
app.use(messageRoutes);

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
})



//------------------connecting to mongo server--------------------
mongoose.connect("mongodb://localhost/onside",{useNewUrlParser: true});
// mongoose.connect("mongodb://kaustuva:T4X1DR1V3R@ds147566.mlab.com:47566/onside",{useNewUrlParser: true});

io.on('connection', function(socket){
  
});

http.listen(process.env.PORT, process.env.IP, function(req,res){
  console.log('listening on'+process.env.PORT);
});