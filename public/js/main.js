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
  console.log( { loadChatMessageHistory: username });
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

  console.log({ loginSuccessMessage: socket });

  const { password, ...store } = socket;
  localStorage.setItem("user", JSON.stringify(store)); // save user to local storage (to store);
  chatMessages.firstChild.remove();
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

function ownMessage(message) {
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
