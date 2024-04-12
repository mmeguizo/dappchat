const gun = GUN();
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
let userName = "";
let userId = "";
let UserPub = "";
let messages = [];
let reloadHist = false;
const {
  username,
  password,
  room = "General",
} = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const regex = /^~([^/]+)\//; // Regular expression to match the desired part
const socket = io();

console.log("testesr");

const userDb = gun.user().recall({ sessionStorage: true });

console.log(userDb);

userDb.create(username, password, async (createCb) => {
  if (createCb.err) {
    userDb.auth(username, password, async (cb) => {
      if (cb.err) {
        console.info(cb.err + " Unable to login " + createCb.err);
        alert(cb.err);
        window.location = "../index.html";
        return;
      } else {
        console.info({ message: "Success Login" });
        socket.emit("login", { username, password, room }, cb.sea.pub);

        var match = {
          // lexical queries are kind of like a limited RegEx or Glob.
          ".": {
            // property selector
            ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(), // find any indexed property larger ~3 hours ago
          },
          "-": 1, // filter in reverse
        };
        // Get Messages
        gun
          .get("meguizomindol")
          .map(match)
          .once(async (data, id) => {
            if (data) {
              // Key for end-to-end encryption
              console.log(data);
              var message;
              var pubs = await gun.user(data)._.get.slice(1);
              // console.log(message.who =  await gun.user(data).get('alias') );
              // console.log( message.what = await SEA.decrypt(data.what, "#foo") );
              //       console.log(message.when = moment(data._[">"].what).format("h:mm a"));
              var message = {
                username: await gun.user(data).get("alias"),
                text: await SEA.decrypt(data.what, "#foo").then(
                  (decryptedWhat) => decryptedWhat
                ),
                time: moment(data._[">"].what).format("h:mm a"),
                pub: pubs,
              };
              
              messages.push(message)
              
              messages.forEach((message) => {
                console.log({ MESSAGES : message});
                if (cb.sea.pub === pubs && !reloadHist) {
                  ownOldMessage(message);
                } else {
                  useroldMessage(message)
                }
              })
            }
          });
        UserPub = cb.sea.pub;
        return;
      }
    });
  } else {
    const { ok, pub } = createCb;
    console.info({ ok, pub }, " created user");
    socket.emit("newUserLogin", { username, password, room, pub });
    UserPub = pub;
    return;
  }
});

//Message from server
socket.on("message", (socket) => {
  outputMessage(socket);
});
socket.on("WelcomeMessage", (socket) => {
  generalMessage(socket);
});

socket.on("callbackMessage", (socket) => {
  if (socket.indexOf("short") !== -1) {
    alert(socket);
    window.location.href = "../index.html";
  } else {
    alert(socket);
  }
});

socket.on("redirectToChat", (url) => {
  window.location.href = url;
});

socket.on("connected", (socket) => {
  // outputMessage(socket);
  generalMessage(socket);
});
socket.on("loadingHistory", (message) => {
  // outputMessage(socket);
  // generalMessage(socket);
  const div = document.createElement("div");
  div.id = "message";
  //div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
});

socket.on("loadChatMessageHistory", async (message, username) => {
  console.log({ loadChatMessageHistory: username });
  message.forEach((message) => {
    if (message.username === username) {
      ownMessageHistory(message);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      userMessageHistory(message);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    //add scroll to bottom
    // chatMessages.scrollTop = chatMessages.scrollHeight;
    // chatMessages.scrollTo({
    //   top: chatMessages.scrollHeight,
    //   behavior: "smooth",
    // });
    // chatMessages.scrollTo({
    //   top: chatMessages.scrollHeight,
    //   behavior: "smooth",
    // });
    setTimeout(() => {
      removeLoading();
    }, 1000);
  });
});

// // Get room and users
// socket.on("roomUsers", (users) => {
//   console.log({  roomUsers : users });
//   outputUsers(users);
// });


// Message submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  let chatmessage = "";
  // Get message text
  const msg = e.target.elements.msg.value;
  // Emit message to server
  //clear message after submit
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
  
  const secret = await SEA.encrypt(msg, "#foo");
  const messageDb = userDb.get("all").set({ what: secret });
  const index = new Date().toISOString();
  gun.get("meguizomindol").get(index).put(messageDb);
  socket.emit("chatMessage", { msg, userName, UserPub });
});

socket.on("chatMessage", (socket) => {
  console.log({ Messages: messages });
  console.log({ chatMessages: socket });

  if (socket.pub === UserPub) {
    ownMessage(socket);
  } else {
    userMessage(socket);
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
socket.on("loginSuccessMessage", (socket) => {
  console.log({ loginSuccessMessage: socket, username: socket.username });
  const { password, ...store } = socket;
  store.pub = socket.pub || pub;
  localStorage.setItem("user", JSON.stringify(store));
  userName = store.username;
});

function removeLoading() {
  // chatMessages.firstChild.remove();
  // chatMessages.document.getElementById("message");
  chatMessages.removeChild(document.getElementById("message"));
}

// output the old messages first to the chat messages before the newer ones or new messages
//create here

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

function generalMessage(message) {
  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}
function userMessage(message) {
  console.log({ userMessage: message });

  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  div.style.marginRight = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}
function useroldMessage(message) {
  console.log({ userMessage: message });

  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("oldUserMessage");
  div.style.backgroundColor = "rgb(149 174 215)";
  div.style.marginRight = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

function ownMessage(message) {
  console.log({ ownMessage: message });

  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  div.style.backgroundColor = "#0866ff";
  div.style.marginLeft = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.style.overflowWrap = "break-word";
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}
function ownOldMessage(message) {
  console.log({ ownMessage: message });

  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  div.style.backgroundColor = "rgb(149 174 215)";
  div.style.marginLeft = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.style.overflowWrap = "break-word";
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});

function ownMessageHistory(message) {
  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  div.style.backgroundColor = "#0866ff";
  div.style.marginLeft = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.style.overflowWrap = "break-word";
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").prepend(div);

  const parent = document.querySelector(".chat-messages");
  const existingDiv = document.querySelector("#message");
  parent.insertBefore(div, existingDiv);
}

function userMessageHistory(message) {
  const div = document.createElement("div");
  // div.id = "message";
  div.classList.add("message");
  div.style.marginRight = "45%";
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username + " ";
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerHTML = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").prepend(div);

  // chatForm.insertBefore(div, document.querySelector("#message"));
  // chatForm.insertBefore(document.querySelector("#message") ,div );

  const parent = document.querySelector(".chat-messages");
  const existingDiv = document.querySelector("#message");
  parent.insertBefore(div, existingDiv);
}

async function getHistoryMessage(cb) {
  return cb(messages);
}

// async function getdata() {
//   // const fetch = require("node-fetch")
//   let response = await fetch('https://api.data.gov.sg/v1/environment/pm25')
//   let data = await response.json()
//   return data
//   };

// const resulteast = getdata().then(data => data.items[0].readings.pm25_one_hourly);

// var valueeast = Promise.resolve(resulteast)
//   valueeast.then(data => {
//   array = data
//   console.log(array)
//   });
