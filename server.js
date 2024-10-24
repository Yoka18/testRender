const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const path = require('path')

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/room', (req, res) => {
    res.redirect(`/room/${uuidV4()}`)
})

app.get('/room/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
    console.log("Someone joined the server")
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)

        // Mesajları dinle ve ilgili odaya ilet
        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message)
        })

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
            console.log("Someone left from the server")
        })
    })
})

server.listen(3000, () => {
    console.log("Server started on port 3000")
})
