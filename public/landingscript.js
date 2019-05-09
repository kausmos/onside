

var index=0;

$(document).ready(function(){
    
  setInterval(showNext, 1000);
});


function resetDisplays(){
    $(".caption").removeClass("d-none");
    $(".caption").addClass("d-block");
}

function showNext(){
        if (index==2){
            resetDisplays();
            index=0;
        }
        else{
            $(".caption")[index].classList.add("d-none");
            $(".caption")[index].classList.remove("d-block");
            index++;
        }
    }

