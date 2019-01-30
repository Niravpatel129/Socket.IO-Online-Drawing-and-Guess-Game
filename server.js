const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
var connections = [] //list of clients
console.log("SERVER STARTED!!");
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
var counter = 0;
const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
var newgame = false;
app.use(express.static(publicPath));

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
    // socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined.`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    // find index of a certain user
    
    var user = users.getUser(socket.id);
    var userlist = [] 
    userlist = (users.getUserList(user.room));
    var color = userlist.indexOf(user.name);
    if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text, color));
    }
    if(callback){
      callback();
    }
  });
  socket.on('draw', function (input) {
    var user = users.getUser(socket.id);

    io.to(user.room).emit('draw', input);
  })

  socket.on('startgame2', function () {
    newgame = true;
    var user = users.getUser(socket.id);
    console.log(user)
    io.to(user.room).emit('newMessage', generateMessage('[Server]:', `Drawer is: ` + user.name, 8, 'lightyellow'));
    io.to(user.room).emit('startgame2');
  })

  // socket erase for everyone
  socket.on('eraseall', function () {
    var user = users.getUser(socket.id);
    io.to(user.room).emit('eraseall');
  })


  socket.on('whodraws', function () {
    var user = users.getUser(socket.id);

    io.to(user.room).emit('whodraws', connections);
  })
  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);

    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));  
    }
  });

  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);

    if (newgame) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      //  io.to(user.room).emit('newMessage', generateMessage('Server:', `${user.name} has left.`));
    }
  });

});



server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
