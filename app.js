var directionParser = require("./lib/directionParser.js");
var tcp = require("./lib/tcpServer.js");
var engineControl = require("./lib/engineControl.js"); 


directionParser.parser.on("backwards", function(value){
/*  engineControl.engines.top1(value);
  engineControl.engines.top2(value);*/
});

directionParser.parser.on("forward", function(value){
/*  engineControl.engines.top1(value);
  engineControl.engines.top2(value);*/
});

directionParser.parser.on("left", function(value){
  engineControl.engines.top1(value);
  engineControl.engines.bot1(value);
});

directionParser.parser.on("right", function(value){
  engineControl.engines.top2(value);
  engineControl.engines.bot2(value);
});


tcp.server.on("data", function(data){
  directionParser.parser.parseGyro(data.g);

  if (data.c){
    engineControl.engines.allEngines(data.v); 
  }


});


engineControl.engines.allEngines(0.01); 
engineControl.engines.takeOff();
