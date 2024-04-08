const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
let = combinedUsers = [];
let messagesDb = [];

const { username, password, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

socket.emit("joinRoom", { username, password, room });

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

socket.on("loadChatMessageHistory", async (message,username) => {
 console.log(message);
 console.log(username);
  message.forEach(message => {
      console.log(message);

    if(message.username === username){
      ownMessage(message)
    }else{
      userMessage(message)
    }

      // outputMessage(message);
      });

      // if (message.username) {
        
      // }

  // outputMessage(await message)
  // setTimeout(() => {
  //   const uniqueUsers = {};
  //   for (const userArray of messagesDb) {
  //     for (const user of userArray) {
  //       const userId = user.username;
  //       if (!uniqueUsers[userId]) {
  //         // Add the user to the dictionary if not already present
  //         uniqueUsers[userId] = user;
  //       }
  //     }
  //   }
  //    combinedUsers = Object.values(uniqueUsers);
  //   console.log(combinedUsers);
  //   outputMessage(combinedUsers[0])
  // }, 3000);

  // message.forEach(element => {
  //   const div = document.createElement("div");
  //   div.id = "message";
  //   div.classList.add("message");
  //   const p = document.createElement("p");
  //   p.classList.add("meta");
  //   p.innerText = message.username + " ";
  //   p.innerHTML += `<span>${message.time}</span>`;
  //   div.appendChild(p);
  //   const para = document.createElement("p");
  //   para.classList.add("text");
  //   para.innerHTML = message.text;
  //   div.appendChild(para);
  //   document.querySelector(".chat-messages").appendChild(div);
  // });
});

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on("chatMessage", (socket) => {
  const userData = JSON.parse(localStorage.getItem("user"));
  // messagesDb = socket.messages
  console.log({ chatMessages: socket });

  if (userData.username === socket.username.toLowerCase()) {
    ownMessage(socket);
  } else {
    userMessage(socket);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // Get message text
  const msg = e.target.elements.msg.value;
  // Emit message to server
  socket.emit("chatMessage", msg);
  //clear message after submit
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

socket.on("loginSuccessMessage", (socket) => {
  const { password, ...store } = socket;
  localStorage.setItem("user", JSON.stringify(store)); // save user to local storage (to store);
  chatMessages.firstChild.remove();
});

function removeLoading() {
  chatMessages.firstChild.remove();
}

// output the old messages first to the chat messages before the newer ones or new messages
//create here

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.id = "message";
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
  div.id = "message";
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
  const div = document.createElement("div");
  div.id = "message";
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

function ownMessage(message) {
  const div = document.createElement("div");
  div.id = "message";
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

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});

/*
//original message
function outputMessage(message) {
  const div = document.createElement("div");
  div.id = "message";
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

*/
