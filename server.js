const path = require('path');
const sleep = require('sleep');
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
var drawWords = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry"];
var drawWord = 'Puppy';
var gameloop;
var listofPlayers = [];
var correctWordCounter = 0;
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

    //admin command
    if (message.text == '/zxc') {
      io.to(user.room).emit('whodraws');

    }

    //check if the new command is called
    if (message.text == '/new') {
      correctWordCounter = 0;
      drawer = 0;
      drawWord = drawWords[Math.floor(Math.random() * 6) + 1];
      gameloop = true;
      console.log('playerlist', userlist);
      // Set the game into a Safe Empty State
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
      if(listofPlayers[drawer] != null){
        io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Drawer is now: ' + listofPlayers[drawer].name, 7, 'lightyellow'));
      }else{
        console.log('Game loop turned False because list of player drawer is null!');
        gameloop = false;
      }
      console.log('start function called!');
      start();
    } else if (message.text.toUpperCase() == drawWord.toUpperCase()) {
      io.to(user.room).emit('newMessage', generateMessage('[SERVER]', user.name + ' Guessed Correctly!', 3, 'lightyellow'));
      for (var i = 0; i < listofPlayers.length; i++) {
        if (listofPlayers[i].socket == socket.id) {
              listofPlayers[i].points += countdown + 5;
              io.to(user.room).emit('newMessage', generateMessage('[SERVER]', user.name + ' now has: ' + listofPlayers[i].points, 3, 'lightyellow'));
              correctWordCounter++;
        }
      }

      io.to(user.id).emit('correctword');

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

  // listen for cleanword
  socket.on('cleanword', function (data) {
    var user = users.getUser(socket.id);
    socket.to(user.room).emit('cleanword', data);
  })

  // timer and game loop
  function start() {
    var user = users.getUser(socket.id);

    setInterval(function () {
      if (gameloop) {
        io.in(user.room).emit('timer', { countdown: countdown });
        if (listofPlayers[drawer] != null) {
          io.to(listofPlayers[drawer].socket).emit('whodraws')
          io.to(listofPlayers[drawer].socket).emit('drawWord', "The draw word is: " + drawWord)

          countdown--;
        }
      }
      if (countdown <= 0 && gameloop || (correctWordCounter >= listofPlayers.length-1)) {
        //round end
        correctWordCounter = 0;
        io.to(user.room).emit('newMessage', generateMessage('[ROUND END]', 'The Draw word was: ' + drawWord, 5, 'lightyellow'));
        sleep.sleep(1);
        drawWord = drawWords[Math.floor(Math.random() * 6) + 1];
        io.in(user.room).emit('takeawaydraw');
        io.in(user.room).emit('clearchat');
        io.in(user.room).emit('eraseall');
        io.in(user.room).emit('timer', { countdown: 0 });
        drawer++;
        if (listofPlayers[drawer] != null) {
          io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Next Round!', 5, 'lightyellow'));
          io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Drawer is now: ' + listofPlayers[drawer].name, 7, 'lightyellow'));
          countdown = 60;
        } else {
          gameloop = false;
          io.to(user.room).emit('newMessage', generateMessage('[SERVER]', 'Game Ended everyones drawed', 5, 'lightyellow'));
          io.to(user.room).emit('drawWord', '')

          // Game should end here
        }
      }
    }, 1200);
  }


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


