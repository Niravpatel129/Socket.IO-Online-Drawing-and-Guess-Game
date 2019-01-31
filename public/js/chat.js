var socket = io();
var drawPerm = false;
//COLORS
var COLORS = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

//list of users currently playing in the lobby
var users;

//Check if erase was called

//Check to see if start game was called
socket.on('startgame2', function (userlist) {
  startgame();

});
// Check if drawword is given
socket.on('drawWord', function (drawWord) {
  socket.emit('cleanword')
  $('.word').html("Your Word is: ");
  $('.word2').html("Your Word: " + drawWord);

});

// Clear Data for players not drawing
socket.on('cleanword', function (word) {
  var guess = "";
  for (var i = 0; i < word; i++) {
    guess += '_ '
  }

  if (word == '') {
    $('.word2').html("Game Ended");

  } else {
    $('.word2').html(guess);
  }
})

socket.on('clearchat', function () {
  $("input").removeAttr('disabled');
  $("input").attr('placeholder', 'Message');
  $("input").css('background-color', '');
})



//Start Game Function
function startgame() {
  console.log('startgame function called');
  socket.emit('eraseall');

}

//Correct Word socket
socket.on('correctword', function () {
  $("input").attr('disabled', 'disabled');
  $("input").attr('placeholder', 'Correct Word Guessed!');
  $("input").css('background-color', 'lightgreen');
})

// Drawing
//receive drawing from server
socket.on('draw', function (data) {
  ctx.beginPath();
  ctx.moveTo(data.prevX, data.prevY);
  ctx.lineTo(data.currX, data.currY);
  ctx.stroke()
  ctx.closePath();


})
var canvas, ctx, flag = false,
  prevX = 0,
  currX = 0,
  prevY = 0,
  currY = 0,
  dot_flag = false;

var x = "black",
  y = 2;

//DRAWING Function Below
var canvas, ctx, flag = false,
  prevX = 0,
  currX = 0,
  prevY = 0,
  currY = 0,
  dot_flag = false;

var x = "black",
  y = 2;



function init() {
  canvas = document.getElementById('can');
  ctx = canvas.getContext("2d");
  w = canvas.width;
  h = canvas.height;

  socket.on('takeawaydraw', function (data) {
    console.log('You dont get to draw');
    $('canvas').css('opacity', '0.9')
    drawPerm = false;
  })

  socket.on('whodraws', function (data) {
    console.log('The Gods have blessed you with drawing permissions');
    $('canvas').css('opacity', '1')
    drawPerm = true;
    allowDraw();
  })
  function allowDraw() {
      canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
      }, false);
      canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
      }, false);
      canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
      }, false);
      canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
      }, false);
    }
  


  function color(obj) {
    switch (obj.id) {
      case "green":
        x = "green";
        break;
      case "blue":
        x = "blue";
        break;
      case "red":
        x = "red";
        break;
      case "yellow":
        x = "yellow";
        break;
      case "orange":
        x = "orange";
        break;
      case "black":
        x = "black";
        break;
      case "white":
        x = "white";
        break;
    }
    if (x == "white") y = 14;
    else y = 2;

  }



  function erase() {
    var m = true;
    if (m) {
      ctx.clearRect(0, 0, w, h);
      document.getElementById("canvasimg").style.display = "none";
    }
  }

  function save() {
    document.getElementById("canvasimg").style.border = "2px solid";
    var dataURL = canvas.toDataURL();
    document.getElementById("canvasimg").src = dataURL;
    document.getElementById("canvasimg").style.display = "inline";
  }

  function findxy(res, e) {
    if (drawPerm == true) {
      if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop;

        flag = true;
        dot_flag = true;
        if (dot_flag) {
          ctx.beginPath();
          ctx.fillStyle = x;
          ctx.fillRect(currX, currY, 2, 2);
          ctx.closePath();
          dot_flag = false;
        }
      }


      if (res == 'up' || res == "out") {
        flag = false;
      }
      if (res == 'move') {
        if (flag) {
          prevX = currX;
          prevY = currY;
          currX = e.clientX - canvas.offsetLeft;
          currY = e.clientY - canvas.offsetTop;
          draw();
        }


        function removeDraw() {
          console.log('removeDraw');

          canvas.addEventListener("mousemove", function (e) {
            findxy('', e)
          }, false);
          canvas.addEventListener("mousedown", function (e) {
            findxy('', e)

          }, false);
          canvas.addEventListener("mouseup", function (e) {
            findxy('', e)

          }, false);
          canvas.addEventListener("mouseout", function (e) {
            findxy('', e)

          }, false);
        }


        function draw() {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(currX, currY);
          ctx.strokeStyle = x;
          ctx.lineWidth = y;
          ctx.stroke();
          ctx.closePath();
          // send draw data
            socket.emit('draw', { currX, currY, prevX, prevY });

          

        }
      }
    }

    socket.on('eraseall', () => {
      erase();
    });

  }

}


//CHAT
function scrollToBottom() {
  // Selectors
  var messages = jQuery('#messages');
  var newMessage = messages.children('li:last-child')
  // Heights
  var clientHeight = messages.prop('clientHeight');
  var scrollTop = messages.prop('scrollTop');
  var scrollHeight = messages.prop('scrollHeight');
  var newMessageHeight = newMessage.innerHeight();
  var lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function () {
  var params = jQuery.deparam(window.location.search);

  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
    }
  });
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users) {
  var ol = jQuery('<ol></ol>');

  users.forEach(function (user) {
    ol.append(jQuery('<li></li>').text(user));
  });

  jQuery('#users').html(ol);
});

socket.on('newMessage', function (message) {


  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime,
    color: COLORS[message.color],
    backgroundcolor: message.backgroundcolor
  });
  jQuery('#messages').append(html);


  scrollToBottom();
});

socket.on('newLocationMessage', function (message) {
  var formattedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#location-message-template').html();
  var html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });


  jQuery('#messages').append(html);
  scrollToBottom();
});


//timer
socket.on('timer', function (data) {
  var template2 = jQuery('#timer-template').html();
  var html2 = Mustache.render(template2, {
    timekeep: data.countdown
  });

  var timerkeeper = jQuery('#timekeeper');

  $('#timer').html(html2);

})

jQuery('#message-form').on('submit', function (e) {
  e.preventDefault();

  var messageTextbox = jQuery('[name=message]');

  socket.emit('createMessage', {
    text: messageTextbox.val()
  }, function () {
    messageTextbox.val('')
  });
});

var locationButton = jQuery('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location.');
  });
});



function eraseall() {
  socket.emit('eraseall');
}


