// On connecte le fichier au serveur
var socket = io.connect('http://localhost:8080');

// while(!channel) {
//     var channel = prompt('Tu veux rejoindre quel channel ?');
// }
// socket.emit('channel', channel);



// On demande le pseudo de la personne
while(!pseudo) {
    var pseudo = prompt('quel est ton nom ?');
}

socket.emit('pseudo', pseudo);
document.title = pseudo + ' - ' + document.title;



// On attends l'emission 'newUser' du serveur, si il est reçu on ajoute un message 
// contenant les informations emises par le serveur, et ajoutant le user à la liste des users
socket.on('newUser', (pseudo) => {
    createElementFunction('newUser', pseudo);
});
socket.on('newUserInDb', (pseudo) => {
    newOption = document.createElement('option');
    newOption.textContent = pseudo;
    newOption.value = pseudo;
    document.getElementById('receiverInput').appendChild(newOption);
})

// On check si le user se déconnecte
socket.on('quitUser', (message) => {
    createElementFunction('quitUser', message);
});

// On attend un nouveau message
socket.on('newMessageAll', (content) => {

    createElementFunction('newMessageAll', content);

});

// On attend un message privé
socket.on('whisper', (content) => {

    createElementFunction('whisper', content);

});

// Une personne est en train d'ecrire
socket.on('writting', (pseudo) => {
    document.getElementById('isWritting').textContent = pseudo + ' est en train d\'ecrire';
});

// Elle a arrêté d'ecrire
socket.on('notWritting', (pseudo) => {
    document.getElementById('isWritting').textContent = '';
});


socket.on('oldMessages', (messages) => {
    messages.forEach(message => {
        createElementFunction('oldMessages', {sender: message.sender, content: message.content});
    });
});
socket.on('emitChannel', (channel) => {
    if(channel.previousChannel) {    
        document.getElementById(channel.previousChannel).classList.remove('inChannel')
    }
    document.getElementById(channel.newChannel).classList.add('inChannel')
})

socket.on('oldWhispers', (whispers) => {
    whispers.forEach(whisper => {
        createElementFunction('oldWhispers', {sender: whisper.sender, content: whisper.content});
    });
});


// Quand on soumet le formulaire
document.getElementById('chatForm').addEventListener('submit', (e)=>{

    e.preventDefault();

    // On récupère la valeur dans l'input et on met le input a 0
    const textInput = document.getElementById('msgInput').value;
    document.getElementById('msgInput').value = '';

    // On récupère le destinataire du message
    const receiver = document.getElementById('receiverInput').value;

    // Si la valeur > 0, on envoie un message au serveur contenant la valeur de l'input 
    if(textInput.length > 0) {

        socket.emit('newMessage', textInput, receiver);

        if(receiver === "all") {
            createElementFunction('newMessage', textInput);
        }

    }
    else {
        return false;
    }

});

// S'il ecrit on emet 'writting' au serveur
function writting() {
    socket.emit('writting', pseudo);
}

// S'il ecrit plus on emet 'notWritting' au serveur
function notWritting() {
    socket.emit('notWritting', pseudo);
}



function createElementFunction(element, content) {
    
    const newElement = document.createElement("div");

    switch(element){

        case 'newMessage':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = pseudo + ': ' + content;
            newElement.id = 'newMessage';
            document.getElementById('msgContainer').appendChild(newElement);
            break;
            
            
        case 'newMessageAll':
            newElement.classList.add(element, 'message');
            newElement.id = content.id;
            newElement.innerHTML = content.pseudo + ': ' + content.message;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'whisper':
            newElement.classList.add(element, 'message');
            newElement.textContent = content.sender + ' vous chuchote: ' + content.message;
            newElement.id = 'message';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'newUser':
            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' à rejoint le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'quitUser':
            newElement.classList.add(element, 'message');
            newElement.textContent = content + ' à quitter le chat';
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldMessages':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = content.sender + ': ' + content.content;
            newElement.id = content.id;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

        case 'oldWhispers':
            newElement.classList.add(element, 'message');
            newElement.innerHTML = content.sender + ' vous chuchote : ' + content.content;
            document.getElementById('msgContainer').appendChild(newElement);
            break;

    }
}


function _joinRoom(channel){
  
    // On réinitialise les messages
    document.getElementById('msgContainer').innerHTML = "";

    // On émet le changement de room
    socket.emit('changeChannel', channel);

    
}


function _createRoom(){
    while(!newRoom){
        var newRoom = prompt('Quel est le nom de la nouvelle Room ?');
    }
    
    const newRoomItem = document.createElement("li");
    newRoomItem.classList.add('elementList');
    newRoomItem.id = newRoom;
    newRoomItem.textContent = newRoom;
    newRoomItem.setAttribute('onclick', "_joinRoom('" + newRoom + "')")
    document.getElementById('roomList').insertBefore(newRoomItem, document.getElementById('createNewRoom'));

    _joinRoom(newRoom);

}
