// public/script.js

const socket = io('/')
const videoGrid = document.getElementById('video-grid')

// Yerel video akışınızı alın
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  const myVideo = document.createElement('video')
  myVideo.muted = true
  addVideoStream(myVideo, stream)

  // Yeni bir peer bağlandığında sinyalleme işlemleri
  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })

  // Gelen mesajları dinle
  socket.on('message', async message => {
    await handleSignalingData(message)
  })

  // Odaya katılma
  socket.emit('join-room', ROOM_ID, socket.id)
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

// Eşler arası bağlantıları takip etmek için
const peers = {}
let localConnection

function connectToNewUser(userId, stream) {
  const peerConnection = createPeerConnection(userId)
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
}

function createPeerConnection(userId) {
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' } // STUN sunucusu
    ]
  }
  const peerConnection = new RTCPeerConnection(configuration)
  peers[userId] = peerConnection

  // ICE adaylarını gönder
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('message', {
        type: 'candidate',
        candidate: event.candidate,
        to: userId
      })
    }
  }

  // Uzak akışı al ve ekle
  peerConnection.ontrack = event => {
    const video = document.createElement('video')
    video.srcObject = event.streams[0]
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
  }

  // Teklif oluştur ve gönder
  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(offer)
    socket.emit('message', {
      type: 'offer',
      offer: offer,
      to: userId
    })
  })

  return peerConnection
}

async function handleSignalingData(data) {
  const peerConnection = peers[data.from] || createPeerConnection(data.from)

  if (data.type === 'offer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    socket.emit('message', {
      type: 'answer',
      answer: answer,
      to: data.from
    })
  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
  } else if (data.type === 'candidate') {
    if (data.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
  }
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}
