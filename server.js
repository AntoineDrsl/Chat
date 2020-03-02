var app = require('express')()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server)
var ent = require('ent') //bloque les caractères HTML

app.get('/', function(req, res) {
    res.render('index.ejs')
})

io.sockets.on('connection', function(socket, pseudo) {

    socket.on('newClient', function(pseudo) {
        pseudo = ent.encode(pseudo)
        socket.pseudo = pseudo
        socket.broadcast.emit('newClient', pseudo)
    })

    socket.on('message', function(message) {
        message = ent.encode(message)
        socket.broadcast.emit('message', { pseudo: socket.pseudo, message: message })
    })
})

app.use(function(req, res, next) {
    res.setHeader('Content-type', 'text/html')
    res.status(404).send('Page introuvable !')
})

server.listen(8080)