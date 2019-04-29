var socket = io();

socket.on("chat message", function(msg){
    // $('.msgstreamcontainer').append('<div class="messagetab message-left"><div class="speechbubble"><p>' + msg+'</p></div></div>');
    alert('new message');
    });


    

//select the anchor tags using jquery and add events to them
$(".daynav a").on("click",function(){
   highlightDay(this);
   showSlots(this);
})

function highlightDay(that){
     $(".daynav a").removeClass("dayselect");
    $(that).addClass("dayselect");
}

function showSlots(that){
    if ($(that).html()=="Today"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotstoday").removeClass("d-none");
        $("#slotstoday").addClass("d-flex");
    }
    else if ($(that).html()=="Tomorrow"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotstomorrow").removeClass("d-none");
        $("#slotstomorrow").addClass("d-flex");
    }
    else if ($(that).html()=="All Slots"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotscurrentyear").removeClass("d-none");
        $("#slotscurrentyear").addClass("d-flex");
    }
    else if ($(that).html()=="Ongoing"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotsongoing").removeClass("d-none");
        $("#slotsongoing").addClass("d-flex");
    }
    else if ($(that).html()=="Upcoming"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotsupcoming").removeClass("d-none");
        $("#slotsupcoming").addClass("d-flex");
    }
    else if ($(that).html()=="Past"){
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotspast").removeClass("d-none");
        $("#slotspast").addClass("d-flex");
    }
    else{
        $(".slotsection").addClass("d-none");
        $(".slotsection").removeClass("d-flex");
        $("#slotsdayafter").removeClass("d-none");
        $("#slotsdayafter").addClass("d-flex");
    }
    
}

//script for scrolling to the bottom of messages in chat stream
$(".msgstreamcontainer").scrollTop($(".msgstreamcontainer")[0].scrollHeight);

