var socketList = {}

socketList.addSocket=function(username,socket){
    socketList[username]=socket;
}

socketList.getSocket = function(username){
    return socketList[username];
}

module.exports= socketList;