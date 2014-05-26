var events = require('events');
var piblaster = require('pi-blaster.js');
var gpio = require("pi-gpio");


function engines(){

  events.EventEmitter.call(this);
  var self = this;

  //WiringPi and Piblaster have Diff pin numbers - check each one later

  var Top1Pin = 11;
  var Top2Pin = 15;
  var Bot1Pin = 12;
  var Bot2Pin = 13;

  gpio.close(Top2Pin);
  gpio.close(Top1Pin);
  gpio.close(Bot1Pin);
  gpio.close(Bot2Pin);


  this.top1 = function(value){
    PWM(Top1Pin, value)
  }
    
  this.top2 = function(value){
    PWM(2, value)
  }
  
  this.bot1 = function(value){
    PWM(bot1Pin, value)
  }
  
  this.bot2 = function(value){
    PWM(Bot2Pin, value)
  }


  this.allEngines = function(value){
    PWM(Top1Pin, value)
    PWM(Top2Pin, value)
    PWM(Bot1Pin, value)
    PWM(Bot2Pin, value)
  }

  this.takeOff = function(value){
    allEngines(0.2);
    setTimeout(function(){
      allEngines(0.8);
    }, 2000);
  }

  this.land = function(value){
    allEngines(0.1);  
  }

  this.killEngines = function(value){
    allEngines(0.0);
  }


  this.runDiagnostics = function(value){
    killEngines();
    setTimeout(function(){
      PWM(Top1Pin, 1.0);
      setTimeout(function(){
        killEngines();
        PWM(Top1Pin, 1.0);
        setTimeout(function(){
          killEngines();
          PWM(Top1Pin, 1.0);
          setTimeout(function(){
            killEngines();
            PWM(Top1Pin, 1.0);
            
          }, 1000);
        }, 1000);
      }, 1000);      
    }, 1000);
  }
  
  function PWM(pin, value){
    value = Math.abs(value) / 40;
    if (value > 1.0){
      value = 1.0;
    }
    piblaster.setPwm(pin, value);
  }

  function LED(num, bool){
    gpio.open(num, "output", function(err) {        
        console.log("writting");
        gpio.write(num, bool ? 1 : 0, function() {        

        });                          
    });
  }
}

engines.prototype.__proto__ = events.EventEmitter.prototype;

exports.engines = new engines();