const mongoose = require("mongoose");

var bookingSchema = new mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    username: String,
    firstname: String,
    companions:Number,
});

var Booking = mongoose.model("Booking",bookingSchema);

module.exports= Booking;