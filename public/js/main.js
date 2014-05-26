var b = new bond("zaku");
$(document).ready(function(){

});
function bond(username){

  var myProgress=0;
  var socket = io.connect(window.app.ip,{query: "username="+username+"&password=pass"});


 
  socket.on('retry', function(){

    socket.emit('adduser', prompt("What's your name?"));
  });



  function checkYoutube(data){

  }
  //vid controls

  socket.on('bufferstatus', function(data){


  });


  socket.on('play', function(data){


    
  });


  //


  socket.on('newVid', function(data){

  });

  $(document).ready(function(){  
    var level =0;
    $("[type=range]").change(function(){
      var newval=$(this).val();
      console.log(newval);
      $range = $(this);
      socket.emit('keys', newval);
    });


    $("#asc").on("click",function(){
      level = level + 10;
      socket.emit('keys', level);
    });    

    $("#desc").on("click",function(){
      level = level - 10;
      socket.emit('keys', level);
    });
    $(document).keypress(function(e) {
      //console.log(e.which);
      $("h1").html(e.which);
      socket.emit('keys', e.which);
      if(e.which == 13) {
        // enter pressed
      }
    });
  });
};
