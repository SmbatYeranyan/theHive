function doClick(e) {
   
        Ti.Stream.write(socket, Ti.createBuffer({
            value: 'Controller \n CONNECTED!'
        }), writeCallback);
}

var x = 0;

function dtest(e) {
	x = x + 100;
   $.dot.top = x +"dp";
   console.log($.dot);
   alert($.dot.top);

}
var motor =0;
function accel(e){
	motor += 10;
	 Ti.Stream.write(socket, Ti.createBuffer({
            value: motor.toString()
     }), writeCallback);
}

function deccel(e){
	motor -=10;
	 Ti.Stream.write(socket, Ti.createBuffer({
            value: motor.toString()
     }), writeCallback);
}

$.index.open();
// setup your views etc..(or via Alloy) + other logic
// .......
 //create window

var win = Titanium.UI.createWindow({  
    title:'Accelerometer',
    backgroundColor:'#fff'
});
 
//create a dot, that we would manipulate with accelerometer


//get last measure time
var lastTime = new Date().getTime();
 
//get time offset
var offset = 50;
 
//create filter (value between 0.5 and 1, where 1 is no filtering)
var filter = 1.0;
 
//last values
var last_x = 0;
var last_y = 0;
var dot = $.dot;
//sdasasd
//get accelerometer data
Titanium.Accelerometer.addEventListener('update',function(e)
{
    //get current time
    var now = new Date().getTime();
     
    //check if time offset is passed
    if(lastTime + offset < now)
    {
        //use last value, apply filter and store new value
        last_x = e.x * filter + last_x * (1 - filter);
        last_y = e.y * filter + last_y * (1 - filter);
 
 		$.xy.setText((last_x*5) + " - "+ (last_y*5));
        //move dot accordingly (5 times as accelerometer)
        dot.left =  dot.left.toString().split("dp")[0]  + (last_x*5) +"dp";
        dot.top  = dot.top.toString().split("dp")[0] + (last_y*5) + "dp";
        console.log((last_x*5) + " " + (last_y*5));
        //store last update time
        lastTime = now;

	
        var pack ={g: (last_x*5) + "," + (last_y*5)};
        
     Ti.Stream.write(socket, Ti.createBuffer({
            value: JSON.stringify(pack)
     }), writeCallback);
    }
});
 
//disable orientation switching
if (Ti.Platform.osname == 'android'){
    Ti.Gesture.addEventListener('orientationchange', function(e) {
        var curAct = Ti.Android.currentActivity;
        curAct.setRequestedOrientation(Ti.Android.SCREEN_ORIENTATION_PORTRAIT);
    });
}


// NodeACS deployed
var test = 'raw';


var socket = Ti.Network.Socket.createTCP({
    host: '192.168.0.103', port: 1234,
    connected: function (e) {
        Ti.API.info('Socket opened!');
        Ti.Stream.pump(e.socket, readCallback, 1024, true);
        var pack ={g: (0) + "," + (0), c: "", value: ""};
        
     Ti.Stream.write(socket, Ti.createBuffer({
            value: JSON.stringify(pack)
     }), writeCallback);
   },
        error: function (e) {
        Ti.API.info('Error (' + e.errorCode + '): ' + e.error);
    },
});
socket.connect();

function writeCallback(e) {
    Ti.API.info('Successfully wrote to socket.');
}

function readCallback(e) {
    if (e.bytesProcessed == -1)
    {
        // Error / EOF on socket. Do any cleanup here.
    
    }
    try {
        if(e.buffer) {
            var received = e.buffer.toString();
            Ti.API.info('Received: ' + received);
        } else {
            Ti.API.error('Error: read callback called with no buffer!');
        }
    } catch (ex) {
        Ti.API.error(ex);
    }
}
