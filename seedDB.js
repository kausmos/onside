const mongoose= require("mongoose");

mongoose.connect("mongodb://localhost/onside",{useNewUrlParser: true});

var Slot= require("./models/slots.js");
var Booking=require("./models/bookings.js");
var User= require("./models/users.js");

//array containing sample slot information



var slotarray =[
    {
       creator: "kausy",
       start:new Date(),
       send: new Date(),
       date:new Date().toLocaleString(),
        vacancies:8,
    }
    
];

var bookingarray =[{ firstname:"Cristiano",username:"Ronaldo",companions:2}, {firstname:"Harry",username:"Kane",companions: 1}];


// Remove all slots

function seedDB(){
    var slotObjList=[];
    console.log("Printing from inside seedDB");
    Slot.deleteMany({},function makeNewSlots(err){
        if(!err) {
            console.log("Dropped all slots");
            Booking.deleteMany({},function(err){
                if(!err){
                    console.log("Dropped all bookings");
                    slotarray.forEach(function(slot,index,array){
                        Slot.create(slot,function (err,slot){
                            if(!err){
                                slotObjList.push(slot);
                                console.log("Slot added");
                                if(index==(array.length)-1){
                                    bookingarray.forEach(function(booking,index,array){
                                       Booking.create(booking,function(err,booking){
                                           if(!err){
                                               console.log("Booking Created");
                                               slotObjList[index].bookings.push(booking);
                                               slotObjList[index].save();
                                           }
                                       }); 
                                    });
                                }
                            }
                        });
                    });
                }
            });
        }
    });
}

module.exports=seedDB;