const users = [];
// Join user to chat
function userJoin(id, username, password, room, loadHist = 0) {
  const user = { id, username, password, room, loadHist };
  users.push(user);
  return user;
}



// Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}
function setCurrentUserHist(id) {
   let user = users.find((user) => user.id === id)
   if(user){
    user.loadHist = 1;
    return user;
   }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    const removedUser = users.splice(index, 1)[0];
    return removedUser;
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  capitalizeFirstLetter,
  getRoomUsers,
  userLeave,
  setCurrentUserHist
};
