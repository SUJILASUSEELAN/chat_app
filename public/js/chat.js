const socket = io()

const $messageForm = document.querySelector('#msgForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-url-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild
    
    //Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of msgcontainer
    const containerHeight = $messages.scrollHeight

    //how far i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage',(locationUrl)=> {
    const html = Mustache.render(locationTemplate,{
        username : locationUrl.username,
        url : locationUrl.url,
        createdAt : moment(locationUrl.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('message',(message) => {
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on('roomData',({ room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        users,
        room
    })
    document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage',message,(error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered!!!')
    })
})
 document.querySelector('#send-location').addEventListener('click',() => {
     if(!navigator.geolocation){
         return alert('Geolocation is not supported by your browser')
     }
     $sendLocationButton.setAttribute('disabled','disabled')
     navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude : position.coords.latitude,
            longitude : position.coords.longitude},
            () => {
                console.log('Location received!!!')
                $sendLocationButton.removeAttribute('disabled')
            })
     })
 })

 socket.emit('join',{ username, room }, (error)=>{
     if (error){
         alert(error)
         location.href = '/'
     }
 })