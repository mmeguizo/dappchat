require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require("path");
const PORT = process.env.PORT || 3000;
const secretkey = process.env.SECRETKEY;
const io = require("socket.io")(server);
const Qs = require("qs");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  capitalizeFirstLetter,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
var util = require("util");
const Gun = require("gun");
const gun = Gun();
require("gun/sea");
require("gun/axe");
// require("gun/axe");
const userDb = gun.user().recall({ sessionStorage: true });

app.use(Gun.serve);

const botName = "Open Chat 🤖 ";

let messages = [];

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, password, room }) => {
    // add to users
    // const user = userJoin(socket.id, username, password, room);

    socket.emit(
      "connected",
      formatMessage(
        botName,
        `Welcome to Open Chat <span style="color:magenta">${capitalizeFirstLetter(
          username
        )} <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div> checking your credentials.....</span> `
      )
    );

    userDb.create(username, password, (createCb) => {
      if (createCb.err) {
        userDb.auth(username, password, (cb) => {
          if (cb.err) {
            console.info(cb.err + " Unable to login " + createCb.err);
            socket.emit(
              "callbackMessage",
              "User not found / Cant create User : Password too short! "
            );
            return;
          } else {
            // add to users
            const user = userJoin(socket.id, username, password, room);

            socket.join(user.room);

            //    Send users and room info

            socket.emit(
              "WelcomeMessage",
              formatMessage(
                botName,
                `Welcome to Back to Open Chat!  ${capitalizeFirstLetter(
                  username
                )}`
              )
            );

            socket.emit("loginSuccessMessage", user);
            socket.broadcast
              .to(user.room)
              .emit(
                "WelcomeMessage",
                formatMessage(
                  botName,
                  `${username} has logged back to the chat`
                )
              );

            // Send users and room info
            io.to(user.room).emit("roomUsers", {
              room: room,
              users: getRoomUsers(room),
            });

            console.info({ message: "Success Login" });
          }
        });
      } else {
        const { ok, pub } = createCb;

        // add to users
        const user = userJoin(socket.id, username, password, room);

        socket.join(user.room);

        socket.emit(
          "WelcomeMessage",
          formatMessage(
            botName,
            `Welcome to Open Chat! ${capitalizeFirstLetter(username)}`
          )
        );
        socket.emit("loginSuccessMessage", user);
        socket.broadcast
          .to(room)
          .emit(
            "WelcomeMessage",
            formatMessage(botName, `${username} has joined the chat`)
          );

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });

        console.info({ ok, pub }, " created user");
      }
    });

    // socket.join(user.room);
  });

  //runs when client disconnects

  //listen for chatMessage
  socket.on("chatMessage", async (msg) => {
    var match = {
      // lexical queries are kind of like a limited RegEx or Glob.
      ".": {
        // property selector
        ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(), // find any indexed property larger ~3 hours ago
      },
      "-": 1, // filter in reverse
    };

    const user = getCurrentUser(socket.id);

    //new message to be encrypted and saved to db
    const secret = await Gun.SEA.encrypt(msg, secretkey);
    const messageDb = userDb.get("all").set({ what: secret });
    const index = new Date().toISOString();
    gun.get("chat").get(index).put(messageDb);

    const data = gun
      .get("chat")
      .map(match)
      .once((data) => data);

    //get all messages from gun db
    gun
      .get("chat")
      .map(match)
      .once(async (data, id) => {
        if (data) {
          // Key for end-to-end encryption

          var message = {
            // transform the data
            // data: util.inspect(data),
            who: await gun.user(data).get("alias"), // a user might lie who they are! So let the user system detect whose data it is.
            what: (await Gun.SEA.decrypt(data.what, secretkey)) + "", // force decrypt as text.
            when: Gun.state.is(data, "what"), // get the internal timestamp for the what property.
          };

          if (message.what) {
            messages = [...messages.slice(-100), message].sort(
              (a, b) => a.when - b.when
            );
          }
        }
      });
    // Emit message to room clients
    io.to(user.room).emit(
      "chatMessage",
      formatMessage(capitalizeFirstLetter(user.username), msg)
    );
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "chatMessage",
        formatMessage(
          botName,
          `${capitalizeFirstLetter(user.username)} has left the Chat`
        )
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
    userDb.leave();
  });
});

server.listen(PORT, () => {
  console.log("Server started on port 3000");
});
