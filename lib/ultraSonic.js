var events = require('events');
var UltrasonicSensor = require('r-pi-usonic');

function ultraSonic(){

  events.EventEmitter.call(this);
  var ultrasonicSensor = new UltrasonicSensor(24, 23);
  var self = this;

  this.getDistance = function(){
    return ultrasonicSensor.getDistanceCm();
  }


  ultrasonicSensor.getMedianDistanceCm(20, false, function (distanceCm) {
    self.emit('sonarDistance', distanceCm);
  });
  
}

ultraSonic.prototype.__proto__ = events.EventEmitter.prototype;

exports.sonic = new ultraSonic();
