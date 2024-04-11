const moment = require("moment");

function formatMessage(username, text,epub) {
  return {
    epub : epub,
    username,
    text,
    time: moment().format("h:mm a"),
  };
}



 function  formatGunJsMessage(message) {

  return  message.map(message => {
    return  {
      username : message.who,
      text : message.what,
      time: moment(message.when).format("h:mm a"),
    };
  });
 
}

module.exports = {
  formatMessage,
  formatGunJsMessage
};
