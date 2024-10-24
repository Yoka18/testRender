// server.js

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

const users = {}

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    if (!users[roomId]) users[roomId] = []
    users[roomId].push(userId)
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId)

    socket.on('disconnect', () => {
      users[roomId] = users[roomId].filter(id => id !== userId)
      socket.to(roomId).emit('user-disconnected', userId)
    })

    // WebRTC sinyalleme mesajlarını iletme
    socket.on('message', message => {
      socket.to(roomId).emit('message', message)
    })
  })
})

server.listen(3000, () => {
  console.log("Server started on port 3000")
})
