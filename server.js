require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const PORT = process.env.PORT || 3000;
const secretkey = process.env.SECRETKEY;
const io = require("socket.io")(server);
const Qs = require("qs");
const http = require("http").Server(app);
const { formatMessage, formatGunJsMessage } = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  capitalizeFirstLetter,
  userLeave,
  getRoomUsers,
  setCurrentUserHist,
  getAllUsers,
} = require("./utils/users");

var util = require("util");
const Gun = require("gun");
const gun = Gun({ peers: "http://gun-manhattan.herokuapp.com/gun" });
require("gun/sea");
require("gun/axe");
// require("gun/axe");
const userDb = gun.user().recall({ sessionStorage: true });

app.use(Gun.serve);

const botName = "Open Chat 🤖 ";


let currentUser = "";

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  socket.on("login", ({ username, password, room }) => {
    const user = userJoin(socket.id, username, password, room);

    socket.emit(
      "message",
      formatMessage(
        botName,
        `${capitalizeFirstLetter(user.username)} has joined the Open Chat!`
      )
    );

    socket.emit(
      "WelcomeMessage",
      formatMessage(
        botName,
        `Welcome to Back to Open Chat!  ${capitalizeFirstLetter(username)}`
      )
    );

    socket.emit("loginSuccessMessage", user);

    // Send users and room info
    socket.emit("roomUsers", {
      users: getRoomUsers(user.room),
    });
  });

  socket.on("newUserLogin", ({ username, password, room }) => {
    const user = userJoin(socket.id, username, password, room);
    currentUser = getCurrentUser(socket.id);
    // add to users
    // const user = userJoin(socket.id, username, password, room);

    socket.emit(
      "WelcomeMessage",
      formatMessage(
        botName,
        `Welcome to Open Chat! ${capitalizeFirstLetter(username)}`
      )
    );
    socket.emit("loginSuccessMessage", user);
    socket.emit("roomUsers", {
      users: getRoomUsers(user.room),
    });
  });

  //runs when client disconnects
  //listen for chatMessage
  socket.on("chatMessage", async (userMessage) => {
    const { userName, msg, epub } = userMessage;
    // Emit message to room clients
    io.emit(
      "chatMessage",
      formatMessage(capitalizeFirstLetter(userName), msg, epub)
    );
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      socket.emit(
        "chatMessage",
        formatMessage(
          botName,
          `${capitalizeFirstLetter(user.username)} has left the Chat`
        )
      );
    }
    userDb.leave();
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

server.listen(PORT, () => {
  console.log("Server started on port:" + PORT);
});
