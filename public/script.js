const socket = io("/")

const videoGrid = document.getElementById("video-grid");

console.log("script loaded");

// peer çalıştırmak için 
// peerjs --port 3001
const myPeer = new Peer(undefined, {
    host: "/",
    port: "3001"
})

const myVideo = document.createElement("video")
myVideo.muted = true
const peers = {}





const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')
const messageContainer = document.getElementById('messages')

// Mesaj gönderme formunu dinleyin
messageForm.addEventListener('submit', e => {
  e.preventDefault()
  const message = messageInput.value
  if (message.trim() !== '') {
    socket.emit('message', message)
    appendMessage(`Ben: ${message}`)
    messageInput.value = ''
  }
})

// Gelen mesajları al ve ekranda göster
socket.on('createMessage', message => {
  appendMessage(`Diğer: ${message}`)
})

// Mesajları listeye ekleyen fonksiyon
function appendMessage(message) {
  const messageElement = document.createElement('li')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}






navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream);

    // bize gönderdikleri isteği cevaplayıp onlara bizim verimizi gönderiyoruz
    myPeer.on("call", call => {
        call.answer(stream)
        const video = document.createElement("video")
        call.on("stream", userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    // on fonksiyonu fonksiyonları dinlememize yarar
    // yeni bağlanan kullanıcıya görüntüyü göndermemiz için
    socket.on("user-connected", userId => {
        connectToNewUser(userId, stream)
        console.log("User connnected: " + userId);
    })
})


socket.on("user-disconnected", userId => {
    if (peers[userId]) {
        peers[userId].close()
    }
    console.log("User disconnected: " + userId);
})


// peer sunucusuna bağlandığımız zaman
myPeer.on("open", id => {
    // emit fonksiyon çalıştırma fonksiyonu diyebiliriz
    socket.emit("join-room", ROOM_ID, id)

})


function connectToNewUser(userId, stream) {
    // call fonksiyonu id si verilen kullanıcıya veri gönderir 
    const call = myPeer.call(userId, stream)
    const video = document.createElement("video")
    call.on("stream", userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on("close", () => {
        video.remove()
    })

    peers[userId] = call
}


function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener("loadedmetadata", () => {
        video.play();
    })
    videoGrid.append(video)
}

