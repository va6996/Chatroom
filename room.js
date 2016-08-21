var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/users';
var client = [];

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){

	client[socket.id] = socket;
	console.log('a user connected: ' + socket.id);
	//client[socket.id].emit('connect');

	socket.on('uid', function(uid){
		if(uid!=null){
			client[socket.id].emit('reregister');
			console.log('reregistered');
		}
		else{
			var randomlyGeneratedUID = Math.random().toString(36).substring(3,16);
			client[socket.id].emit('register', randomlyGeneratedUID);
			console.log('register');
		}
	});
	socket.on('disconnect', function(){
		delete client[socket.id];
		mongo.connect(url, function(err, db){
			if(err)
				console.log(err);
			else{
				var table = db.collection('userlist');  			
  			table.deleteOne({room: '/', id:socket.id}, function(err, res){
  				if(err)
  					console.log(err);
  				console.log(socket.id + 'removed');
  			});
			}
		});
    console.log('user disconnected: ' + socket.id);
  });

  socket.on('chat message', function(nick, msg){
    console.log('message by ' + nick + ': ' + msg);
    io.emit('chat message', nick, msg);
  });
  socket.on('join', function(nick){
  	console.log(nick + ' id: ' + socket.id + ' asked to join');
  	mongo.connect(url, function(err, db){
			if(err)
				console.log(err);
			else{
				var table = db.collection('userlist');  			
  			table.find({room: '/', name: nick}).toArray(function(err, res){
  				if(err)
  					console.log(err);
  				else if(res.length){
  					client[socket.id].emit('denied');
  					console.log(nick + ' id: ' + socket.id + ' denied');
  					//TODO: add condition f already same socket id
  				}
  				else{
  					table.insert({room: '/', name: nick, id: socket.id}, function(err, res){
		  				if(err)
		  					console.log(err);
		  				else{
		  					console.log('Added user ' + nick + ' id: ' + socket.id);
		  					client[socket.id].emit('accepted');
		  				}
	  				});
  				}
  			});
			}
		});
  });
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});