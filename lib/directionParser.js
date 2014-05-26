var events = require('events');

function directionParser(){

  events.EventEmitter.call(this);

  var self = this;

  this.parseGyro = function(gyroObj){
    gyroObj = gyroObj.replace("]","");
    gyroObj = gyroObj.replace("[","");
    var leftGyro =gyroObj.split(",")[0];
    var rightGyro =gyroObj.split(",")[1]; 
    parseIt(leftGyro, rightGyro);
    
    function parseIt(leftGyro, rightGyro){
      if (leftGyro > 0 &&  leftGyro < 40){
          
          self.emit('backwards', leftGyro);
      } 

      if (leftGyro < 0 && leftGyro > -40){
          self.emit('forward', leftGyro);
      }
    
      if (rightGyro > 0 && rightGyro < 40){
          self.emit('right', rightGyro);

      }

      if (rightGyro < 0 && rightGyro > -40){
          self.emit('left', rightGyro);
      }
    }

  }
}

directionParser.prototype.__proto__ = events.EventEmitter.prototype;

exports.parser = new directionParser();
