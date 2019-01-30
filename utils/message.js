var moment = require('moment');

var generateMessage = (from, text, color, backgroundcolor) => {
  return {
    from,
    text,
    createdAt: moment().valueOf(),
    color,
    backgroundcolor
  };
};

var generateLocationMessage = (from, latitude, longitude, color) => {
  return {
    from,
    url: `https://www.google.com/maps?q=${latitude},${longitude}`,
    createdAt: moment().valueOf(),
    
    };
};

module.exports = {generateMessage, generateLocationMessage};
