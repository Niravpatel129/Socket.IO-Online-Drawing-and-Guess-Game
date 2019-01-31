const path = require('path');
var sleep = require('sleep');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
var connections = [] //list of clients
console.log("SERVER STARTED!!");
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { isRealString } = require('./utils/validation');
const { Users } = require('./utils/users');
var counter = 0;
const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
app.use(express.static(publicPath));
var countdown = 0;
var drawer = 0;
var drawWord = 'Cat';
var gameloop;
var listofPlayers = [];

///



///

io.on('connection', (socket) => {

  connections.push(socket.id);

  socket.on('join', (params, callback) => {
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room name are required.');
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined.`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    // find index of a certain user

    var user = users.getUser(socket.id);
    var userlist = []
    userlist = (users.getUserList(user.room));
    var color = userlist.indexOf(user.name);
    //Check if draw word is typed
    if (message.text == drawWord){
      //Add points to user message.name
      //emit back to client to lock from typing any messages
      //Send global message that this person got the word correct
      io.to(user.room).emit('newMessage', generateMessage('[SERVER] ' + user.name + ' Guessed Correctly!', 7, 'lightyellow'));
      //io.to(user.room).emit('newMessage', generateMessage(user.name, message.text, color));


    }
    //check if the new command is called
    if (message.text == '/new') {
      var drawer = 0;
      countdown = 0;
      var user = users.getUser(socket.id);
      var userlist = []
      userlist = (users.getUserList(user.room));
      var color = userlist.indexOf(user.name);
      // Set the game into a Safe Empty State
      var round = 0;
      var user = users.getUser(socket.id);
      var userlist = users.getUserSocketList(user.room);
      var userlistnames = users.getUserList(user.room);
      var playerCount = (userlist.length);
      
      for (var i = 0; i < playerCount; i++) {
        listofPlayers[i] = { 'name': userlistnames[i], 'socket': userlist[i], 'points': 0 }
      }
      countdown = 121;

      gameloop = true;
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'NEW GAME INITALIZED, STARTING IN 5..', 7, 'lightyellow'));
        sleep.sleep(1); // sleep for 1 seconds
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Begin!', 7, 'lightyellow'));

    } else if (message.text == '/start' || message.text == '/s'){
        gameloop = true;
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'NEW GAME INITALIZED, STARTING IN 5..', 4, 'lightyellow'));
        sleep.sleep(1); // sleep for 1 seconds
      }
    else if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text, color));
    }
    if (callback) {
      callback();
    }
  });
  socket.on('draw', function (input) {
    var user = users.getUser(socket.id);
    io.to(user.room).emit('draw', input);
  })

  // Clear The Guess word for everyone
    socket.to('clearWord').emit('GOOD LUCK');

  


  // socket erase for everyone
  socket.on('eraseall', function () {
    var user = users.getUser(socket.id);
    io.to(user.room).emit('eraseall');
  })

// listener
socket.on('cleanword', function(){
  var user = users.getUser(socket.id);
  socket.to(user.room).emit('cleanword', 3);

})

  // timer and game loop
  setInterval(function () {
    if(gameloop){
      var user = users.getUser(socket.id);
        io.to(listofPlayers[drawer].socket).emit('whodraws')
        io.to(listofPlayers[drawer].socket).emit('drawWord', drawWord)
        countdown--;
    }
    if (countdown > 0) {
      io.sockets.emit('timer', { countdown: countdown });
    }else{
      gameloop = false;

    }
  }, 1200);



  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);

    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
    }
  });

  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);

   
  });

});







server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});


