//DÉFINITION DES PARAMETRES

//On appelle tous les modules dont on a besoin
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var cors = require('cors');
const cookieParser = require('cookie-parser');
var mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;

//On se connecte à la base de données
mongoose.connect('mongodb://localhost/Chat', { useNewUrlParser: true, useUnifiedTopology: true }, function(err){
if(err) {
    console.log(err)
} else {
    console.log('Connected to mongodb')
}
})

//On va cherche les models 
require('./models/user.model');
require('./models/chat.model');
require('./models/room.model');
var User = mongoose.model('user');
var Chat = mongoose.model('chat');
var Room = mongoose.model('room');

//On dit à notre application d'utiliser nos modules
app.use(express.urlencoded());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());

//On définit le dossier contenant notre CSS et JS
app.use(express.static(__dirname + '/public'));

//ROUTER
app.get('/', function(req, res) {
    User.find((err, users) => {
        if(users) { 
            Room.find((err, channels) => {
                if(channels){
                    res.render('index.ejs', {users: users, channels: channels});
                }
                else {

                    res.render('index.ejs', {users: users});
                }
            });
        } else {
            Room.find((err, channels) => {
                if(channels){
                    res.render('index.ejs', {channels: channels});
                }
                else {

                    res.render('index.ejs');
                }
            });
        }
    });
});

//404
app.use(function(req, res, next) {
    res.setHeader('Content-type', 'text/html');
    res.status(404).send('Page introuvable !');
});




// IO

var io = require('socket.io').listen(server);
var connectedUsers = []

// Lorsqu'une personne arrive sur la vue index.ejs, la fonction ci-dessous se lance
io.on('connection', (socket) => {
    
    // On recoit 'pseudo' du fichier html
    socket.on('pseudo', (pseudo) => {
        
        User.findOne({ pseudo: pseudo }, (err, user) => {
            //Si il existe, on connecte le user en mettant son pseudo dans les cookies
            if(user) {

                // On join automatiquement le channel "salon1" par défaut
                _joinRoom("salon1");

                // On conserve le pseudo dans la variable socket qui est propre à chaque utilisateur
                socket.pseudo = pseudo;
                connectedUsers.push(socket);
                // On previent les autres
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);
                
                //On va chercher les derniers messages privés
                Chat.find({receiver: socket.pseudo}, (err, whispers) => {
                    if(!whispers) {
                        return false;
                    } else {
                        socket.emit('oldWhispers', whispers);
                    }
                });


            } else {
                var user = new User();
                user.pseudo = pseudo;
                user.save();

                // On join automatiquement le channel "salon1" par défaut
                _joinRoom("salon1");

                socket.pseudo = pseudo;
                connectedUsers.push(socket)
                socket.broadcast.to(socket.channel).emit('newUser', pseudo);
                socket.broadcast.emit('newUserInDb', pseudo);
            }
        })

    });


    function _joinRoom(channelParam) {

        //Si l'utilisateur est déjà dans un channel, on le stock
        var previousChannel = ''
        if(socket.channel) {
            previousChannel = socket.channel; 
        }

        //On quitte tous les channels et on rejoint le channel ciblé
        socket.leaveAll();
        socket.join(channelParam);
        socket.channel = channelParam;

        Room.findOne({name: socket.channel}, (err, channel) => {
            if(channel){
                Chat.find({_id_room: socket.channel}, (err, messages) => {
                    if(!messages){
                        return false;
                    }
                    else{
                        socket.emit('oldMessages', messages);
                        //Si l'utilisateur vient d'un autre channel, on le fait passer, sinon on ne fait passer que le nouveau
                        if(previousChannel) {
                            socket.emit('emitChannel', {previousChannel: previousChannel, newChannel: socket.channel});
                        } else {
                            socket.emit('emitChannel', {newChannel: socket.channel});
                        }
                    }
                });
            }
            else {
        
                var room = new Room();
                room.name = socket.channel;
                room.save();
        
                socket.emit('emitChannel', {previousChannel: previousChannel, newChannel: socket.channel});
            }
        })
    }

    socket.on('changeChannel', (channel) => {
        _joinRoom(channel);
        socket.broadcast.emit('newChannel', channel);
    });

    // Quand un nouveau message est envoyé
    socket.on('newMessage', (message, receiver)=> {
        if(receiver === "all") { 

            var chat = new Chat();
            chat._id_room = socket.channel;
            chat.sender = socket.pseudo;
            chat.receiver = receiver;
            chat.content = message;
            chat.save();

            socket.broadcast.to(socket.channel).emit('newMessageAll', {message: message, pseudo: socket.pseudo, id: chat._id});

        } else {

            User.findOne({pseudo: receiver}, (err, user) => {
                if(!user) {
                    return false
                } else {
                    
                    socketReceiver = connectedUsers.find(element => element.pseudo === user.pseudo)

                    if(socketReceiver) {
                        socketReceiver.emit('whisper', { sender: socket.pseudo, message: message })
                    }

                    var chat = new Chat();
                    chat.sender = socket.pseudo;
                    chat.receiver = receiver;
                    chat.content = message;
                    chat.save();

                }
            })

        }

    });

    // Quand un user se déconnecte
    socket.on('disconnect', () => {
        var index = connectedUsers.indexOf(socket)
        if(index > -1) {
            connectedUsers.splice(index, 1)
        }
        socket.broadcast.to(socket.channel).emit('quitUser', socket.pseudo);
    });

    socket.on('writting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('writting', pseudo);
    });

    socket.on('notWritting', (pseudo) => {
        socket.broadcast.to(socket.channel).emit('notWritting', pseudo);
    });

});


//On dit à Node de se lancer sur le port 8080
server.listen(8080, () => console.log('Server started at port : 8080'));