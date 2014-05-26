var events = require('events');
var piblaster = require('pi-blaster.js');


function engines(){

  events.EventEmitter.call(this);
  var self = this;

  //WiringPi and Piblaster have Diff pin numbers - check each one later

  var Top1Pin = 1;
  var Top2Pin = 4;
  var Bot1Pin = 2;
  var Bot2Pin = 6;

  this.top1 = function(value){
    PWM(Top1Pin, value)
  }
    
  this.top2 = function(value){
    PWM(Top2Pin, value)
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
    self.allEngines(0.2);
    setTimeout(function(){
      self.allEngines(0.8);
    }, 2000);
  }

  this.land = function(value){
    self.allEngines(0.1);  
  }

  this.killEngines = function(value){
    self.allEngines(0.0);
  }


  this.runDiagnostics = function(value){
    setTimeout(function(){
      self.killEngines();
      self.top1(1);    
    }, 1000);    

    setTimeout(function(){
      self.killEngines();
      self.top2(1);    
    }, 3000);    

    setTimeout(function(){
      self.killEngines();
      self.bot1(1);    
    }, 6000);    

    setTimeout(function(){
      self.killEngines();
      self.bot2(1);    
    }, 9000);

  }
  
  function PWM(pin, value){
    value = Math.abs(value) / 40;
      
    if (value > 1.0 && Math.abs(value) > 1.0){
      value = 1.0;
    }
    piblaster.setPwm(pin, value);
  }

}

engines.prototype.__proto__ = events.EventEmitter.prototype;

exports.engines = new engines();
