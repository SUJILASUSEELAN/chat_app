const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, currentUser, getUsersInRoom} = require('./utils/users')
const { get } = require('https')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {
    console.log('New websocket conn')
    
    socket.on('join',({ username, room},callback)=>{
        const { error, user} = addUser({ id : socket.id, username, room })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message',generateMessage('Admin','Welcome!'))    
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users:getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on('sendMessage',(msg,callback) => {
        const filter = new Filter()

        if(filter.isProfane(msg)){
            return callback('Profane words not allowed!')
        }
        const user = currentUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username,msg))
        callback()
    })

    socket.on('sendLocation', (locationCoords,callback) => {
        const user = currentUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,"https://google.com/maps?q="+locationCoords.latitude+","+locationCoords.longitude))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users:getUsersInRoom(user.room) 
            })
        }   
    })

})



server.listen( port , () => {
    console.log("Server listening on port", + port)
})