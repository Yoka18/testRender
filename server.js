const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });

        socket.on('sending-signal', payload => {
            io.to(payload.userToSignal).emit('user-joined', { signal: payload.signal, callerId: payload.callerId });
        });

        socket.on('returning-signal', payload => {
            io.to(payload.callerId).emit('receiving-returned-signal', { signal: payload.signal, id: socket.id });
        });
    });
});

http.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor');
});
