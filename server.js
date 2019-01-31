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
const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
app.use(express.static(publicPath));
var countdown = 0;
var drawer = 0;
var drawWord = 'Puppy';
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
    if (message.text.toUpperCase() == drawWord.toUpperCase()){
      //Add points to user message.name
      //emit back to client to lock from typing any messages
      io.to(user.id).emit('correctword');
      //Send global message that this person got the word correct
      io.to(user.room).emit('newMessage', generateMessage('[SERVER]', user.name + ' Guessed Correctly!', 3, 'lightyellow'));


    }
    //check if the new command is called
    else if (message.text == '/new') {
      io.to(user.room).emit('eraseall');
      var drawer = 0;
      var user = users.getUser(socket.id);
      var userlist = []
      userlist = (users.getUserList(user.room));
      var color = userlist.indexOf(user.name);
      // Set the game into a Safe Empty State
      var round = 0;
      var userlist = users.getUserSocketList(user.room);
      var userlistnames = users.getUserList(user.room);
      var playerCount = (userlist.length);
      
      for (var i = 0; i < playerCount; i++) {
        listofPlayers[i] = { 'name': userlistnames[i], 'socket': userlist[i], 'points': 0 }
      }
      countdown = 30;
      gameloop = true;
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'NEW GAME INITALIZED, STARTING IN 5..', 7, 'lightyellow'));
        sleep.sleep(1); // sleep for 1 seconds
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Drawer is now: ' + listofPlayers[drawer].name, 7, 'lightyellow'));

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
  socket.to(user.room).emit('cleanword', drawWord.length);

})

  // timer and game loop
  setInterval(function () {
    var user = users.getUser(socket.id);

    io.sockets.emit('timer', { countdown: countdown });
    if(gameloop){
        if(listofPlayers[drawer] != null){
          io.to(listofPlayers[drawer].socket).emit('whodraws')
          io.to(listofPlayers[drawer].socket).emit('drawWord', drawWord)
          countdown--;
        }
    }
    if (countdown <= 0 && gameloop) {
      sleep.sleep(1);
      var user = users.getUser(socket.id);
      io.in(user.room).emit('eraseall');
      io.to(user.room).emit('eraseall');
      io.in(user.room).emit('takeawaydraw');
      io.in(user.room).emit('clearchat');
      socket.in('clearWord').emit('GOOD LUCK');
      io.sockets.emit('timer', { countdown: 0 });
      io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Begin New Round', 5, 'lightyellow'));
      drawer++;
      if(listofPlayers[drawer] != null){
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Drawer is now: ' + listofPlayers[drawer].name, 7, 'lightyellow'));
        countdown = 60;
      }else{
        gameloop = false;
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Game Ended everyones drawed', 5, 'lightyellow'));
        io.to(user.room).emit('drawWord', '')

        // Game should end here
      }


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


