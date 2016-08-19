var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var user = [];
var client = [];

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){

	client[socket.id] = socket;
	console.log('a user connected: ' + socket.id);
	
	socket.on('disconnect', function(){
		delete client[socket.id];
		delete user[socket.id];
    console.log('user disconnected: ' + socket.id);
  });

  socket.on('chat message', function(nick, msg){
    console.log('message by ' + nick + ': ' + msg);
    io.emit('chat message', nick, msg);
  });
  socket.on('join', function(nick){
  	var flag = true;
  	console.log(nick + ' id: ' + socket.id + ' asked to join');
  	for(var i in user){
  		if(user[i] == nick){
  			flag = false;
  			break;
  		}
  	}
  	if(!flag){
  		client[socket.id].emit('denied');
  		console.log(nick + ' id: ' + socket.id + ' denied');
  	}
  	else{
  		user[socket.id] = nick;
  		socket.join(nick);
  		client[socket.id].emit('accepted');
  		console.log('Added user ' + nick + ' id: ' + socket.id);
  	}
  });
});

http.listen(4000, function(){
  console.log('listening on *:3000');
});