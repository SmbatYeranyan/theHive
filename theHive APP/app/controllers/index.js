function doClick(e) {
   
        Ti.Stream.write(socket, Ti.createBuffer({
            value: 'Controller \n CONNECTED!'
        }), writeCallback);
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
var offset = 100;
 
//create filter (value between 0.5 and 1, where 1 is no filtering)
var filter = 1.0;
 
//last values
var last_x = 0;
var last_y = 0;

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
 
 
        //move dot accordingly (5 times as accelerometer)
        //dot.left -= (last_x*5);
        //dot.top += (last_y*5);
        console.log((last_x*5) + " " + (last_y*5));
        //store last update time
        lastTime = now;
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
var uri = 'http://192.168.0.118:8000';  

var socket = Ti.Network.Socket.createTCP({
    host: '192.168.0.118', port: 5000,
    connected: function (e) {
        Ti.API.info('Socket opened!');
        Ti.Stream.pump(e.socket, readCallback, 1024, true);
        Ti.Stream.write(socket, Ti.createBuffer({
            value: 'GET http://blog.example.com/index.html HTTP/1.1\r\n\r\n'
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