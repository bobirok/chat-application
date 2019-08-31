const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('join', ( options, callback) => {
        const { error, user} = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('welcomeMessage', generateMessage('Server message', 'Welcome!'))
        socket.broadcast.to(user.room).emit('welcomeMessage', generateMessage('Server message', user.username + ' has joined!'))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        const user = getUser(socket.id)

        io.to(user.room).emit('receiveMessage', generateMessage(user.username, message))
        callback('Delivered!')
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        const url = 'https://google.com/maps/?q=' + coords.latitude + ',' + coords.longitude
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback('Location was shared!')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('welcomeMessage', generateMessage('Server message', 'Opps... ' + user.username + ' has left!'))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Server running on 3000')
})