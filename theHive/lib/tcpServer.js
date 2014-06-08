var events = require('events');

function server(){
  events.EventEmitter.call(this);
  var net = require('net');
  var clients = [];
  var self = this;
  net.createServer(function (socket) {

    socket.name = socket.remoteAddress + ":" + socket.remotePort 
    clients.push(socket);

    socket.on('data', function (data) {
      //{g:'[10.231231,9,1231231123]',c:'increase',v:'0.5'}
      // gyro, control-type, value
      try{
        data = JSON.parse(data);
        self.emit("data", data);

      }
      catch(err){

      }
    });

    socket.on('end', function () {
      clients.splice(clients.indexOf(socket), 1);
    });

    function broadcast(message, sender) {
      clients.forEach(function (client) {
        if (client === sender) return;
        client.write(message);
      });
      process.stdout.write(message)
    }
   
  }).listen(1234);
}

server.prototype.__proto__ = events.EventEmitter.prototype;
exports.server = new server();
