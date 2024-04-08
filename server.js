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

let messages = [];
let roomMessages = [];
let loadChatHist = true;
let currentUser = "";

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, password, room }) => {
    // add to users
    // const user = userJoin(socket.id, username, password, room);

    socket.emit(
      "WelcomeMessage",
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
            currentUser = getCurrentUser(socket.id);
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
        currentUser = getCurrentUser(socket.id);
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
      var match = {
        // lexical queries are kind of like a limited RegEx or Glob.
        ".": {
          // property selector
          // find any indexed property larger ~3 hours ago
          // ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(),
          ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(),
          // find any indexed property smaller ~5  days ago
          // ">": new Date(+new Date() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        "-": 1, // filter in reverse
      };
      // console.log(gun
      //   .get("chat") // Get the 'rooms' node
      //   .get(room) // Get the specific room by its name
      //   .get("messages") // Get the 'messages' node within the room
      //   .map(match)
      //   .once( data => data))

      // i dont know what wrong but if you remove this code the history will not load
      // since gun js is just new and a lot of bugs maybe this might need to be reported
      console.log("==================");
      console.log(
        gun
          .get("chat") // Get the 'rooms' node
          .get(room) // Get the specific room by its name
          .get("messages")
          .map()
          .once((data) => data)
      );
      console.log("==================");

      socket.emit(
        "loadingHistory",
        formatMessage(
          botName,
          `Please wait until loading is finished <span style="color:magenta">${capitalizeFirstLetter(
            username
          )} <div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div> .</span> 
          `
        )
      );

      gun
        .get("chat") // Get the 'rooms' node
        .get(room) // Get the specific room by its name
        .get("messages") // Get the 'messages' node within the room
        .map(match)
        .once(async (data, id) => {
          if (data) {
            var message = {
              who: await gun.user(data).get("alias"),
              what: (await Gun.SEA.decrypt(data.what, secretkey)) + "",
              when: Gun.state.is(data, "what"),
            };

            console.log({ MESSAGE: message });

            if (message.what) {
              messages = [...messages.slice(-50), message].sort(
                (a, b) => a.when - b.when
              );
              //check if we need to load history should only load once
              console.log({ currentUser: currentUser });
             
                setTimeout(() => {
                  if(currentUser.loadHist === 0){
                    socket.emit(
                      "loadChatMessageHistory",
                      formatGunJsMessage(messages),
                      username
                    );
                    setCurrentUserHist(currentUser.id);
                  }
                }, 5000);
            
            }
          }
        });
    });

    // var match = {
    //   // lexical queries are kind of like a limited RegEx or Glob.
    //   ".": {
    //     // property selector
    //     // find any indexed property larger ~3 hours ago
    //     // ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(),
    //     // find any indexed property smaller ~5  days ago
    //     ">": new Date(+new Date() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    //   },
    //   "-": 1, // filter in reverse
    // };

    // gun
    //   .get("rooms") // Get the 'rooms' node
    //   .get(room) // Get the specific room by its name
    //   .get("messages") // Get the 'messages' node within the room
    //   .map(match)
    //   .once(async (data, id) => {
    //     if (data) {
    //       var message = {
    //         who: await gun.user(data).get("alias"),
    //         what: (await Gun.SEA.decrypt(data.what, secretkey)) + "",
    //         when: Gun.state.is(data, "what"),
    //       };

    //       if (message.what) {
    //         messages = [...messages.slice(-1000), message].sort(
    //           (a, b) => a.when - b.when
    //         );

    //         socket.emit("loadChatMessageHistory", messages);
    //       }
    //     }
    //   });

    // gun
    //   .get("chat")
    //   .map(match)
    //   .once(async (data, id) => {
    //     if (data) {
    //       var message = {
    //         // transform the data
    //         // data: util.inspect(data),
    //         who: await gun.user(data).get("alias"), // a user might lie who they are! So let the user system detect whose data it is.
    //         what: (await Gun.SEA.decrypt(data.what, secretkey)) + "", // force decrypt as text.
    //         when: Gun.state.is(data, "what"), // get the internal timestamp for the what property.
    //       };

    //       if (message.what) {
    //         messages = [...messages.slice(-1000), message].sort(
    //           (a, b) => a.when - b.when
    //         );

    //         socket.emit("loadChatMessageHistory", messages);
    //       }
    //     }
    //   });
  });

  //runs when client disconnects

  //listen for chatMessage
  socket.on("chatMessage", async (msg) => {
    // var match = {
    //   // lexical queries are kind of like a limited RegEx or Glob.
    //   ".": {
    //     // property selector
    //     ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(), // find any indexed property larger ~3 hours ago
    //   },
    //   "-": 1, // filter in reverse
    // };

    const user = getCurrentUser(socket.id);
    // setCurrentUserHist(user.id);
    //new message to be encrypted and saved to db
    const secret = await Gun.SEA.encrypt(msg, secretkey);
    const messageDb = await userDb.get("all").set({ what: secret });
    const index = new Date().toISOString();

    gun.get("chat").get(user.room).get("messages").get(index).put(messageDb);

    // gun.get("chat").get(index).put(messageDb);

    // const data = gun
    //   .get("chat")
    //   .map(match)
    //   .once((data) => data);

    //get all messages from gun db
    // gun
    //   .get("chat")
    //   .map(match)
    //   .once(async (data, id) => {
    //     if (data) {
    //       // Key for end-to-end encryption

    //       var message = {
    //         // transform the data
    //         // data: util.inspect(data),
    //         who: await gun.user(data).get("alias"), // a user might lie who they are! So let the user system detect whose data it is.
    //         what: (await Gun.SEA.decrypt(data.what, secretkey)) + "", // force decrypt as text.
    //         when: Gun.state.is(data, "what"), // get the internal timestamp for the what property.
    //       };

    //       if (message.what) {
    //         messages = [...messages.slice(-100), message].sort(
    //           (a, b) => a.when - b.when
    //         );
    //       }
    //     }
    //   });
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

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

server.listen(PORT, () => {
  console.log("Server started on port:" + PORT);
});
