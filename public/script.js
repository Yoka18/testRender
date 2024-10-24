const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
let myVideoStream;

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    socket.emit('join-room', 'room-id', socket.id);

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });

    socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].destroy();
    });

    socket.on('user-joined', payload => {
        const peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: myVideoStream
        });

        peer.on('signal', signal => {
            socket.emit('returning-signal', { signal: signal, callerId: payload.callerId });
        });

        peer.on('stream', userVideoStream => {
            const video = document.createElement('video');
            addVideoStream(video, userVideoStream);
        });

        peer.signal(payload.signal);

        peers[payload.callerId] = peer;
    });

    socket.on('receiving-returned-signal', payload => {
        const peer = peers[payload.id];
        peer.signal(payload.signal);
    });
});

socket.on('createMessage', message => {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatWindow.append(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        socket.emit('message', chatInput.value);
        chatInput.value = '';
    }
});

function connectToNewUser(userId, stream) {
    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: stream
    });

    peer.on('signal', signal => {
        socket.emit('sending-signal', { userToSignal: userId, callerId: socket.id, signal: signal });
    });

    peer.on('stream', userVideoStream => {
        const video = document.createElement('video');
        addVideoStream(video, userVideoStream);
    });

    peers[userId] = peer;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}
