 const socket = io()

 //Elements 
 const $messageForm = document.querySelector('#message-form')
 const $messageFormInput = $messageForm.querySelector('input')
 const $messageFormButton = $messageForm.querySelector('button')
 const $sendLocationButton = document.querySelector('#send-location')
 const $messages = document.querySelector('#messages')
 

 // Templates
 const messageTemplate = document.querySelector('#message-template').innerHTML
 const locationTemplate = document.querySelector('#location-template').innerHTML
 const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

 // Options
 const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

 const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('welcomeMessage', (welcome) => {
    const html = Mustache.render(messageTemplate, {
        username: welcome.username,
        message: welcome.text,
        createdAt: moment(welcome.createdAt).format('H:mmA')
    })
    $messages.insertAdjacentHTML('beforeend', html)})

socket.on('receiveMessage', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: message.createdAt
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoScroll()
})

socket.on('getLocation', (message) => {
    console.log(message)
})

socket.on('locationMessage', (url) => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('H:mmA')
    })
    $messages.insertAdjacentHTML('beforeend', html)

    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) {
            return console.log(error)
        }

        console.log('Message was delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert('Your browser does not support location sharing!')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (message) => {
            console.log(message)
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})