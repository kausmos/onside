const mongoose=require("mongoose");
const Booking=require("./bookings.js");
var slotSchema = new mongoose.Schema({
    creator: String,
    date:String,
    start: Date,
    end: Date,
    vacancies:{
        type:Number,
        min:0,
        max:10
    },
    bookings:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Booking"
    }]
                
});

var Slot=mongoose.model("Slot", slotSchema);

module.exports = Slot;