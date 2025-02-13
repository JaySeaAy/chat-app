const SERVER_URL = 'http://localhost:1337';
const socket = io(SERVER_URL);

const msgInput = $('#message');
const nameInput = $('#name');
const chatRoom = $('#room');
const chatDisplay = $('.chat-display');

let chatAbierto = false;
let mensajes = [];

function contarMensajesNoLeidos(mensajes) {
  return mensajes.filter((msg) => !msg.leido && msg.name !== nameInput.val()).length;
}

function actualizarContadorNoLeidos(mensajes) {
  const unreadCount = contarMensajesNoLeidos(mensajes);
  $('#unreadCount').text(unreadCount);
}

$(document).ready(function () {
  $('#openChatBtn').click(function () {
    chatAbierto = !chatAbierto;
    $('#chatContainer').toggle();

    socket.emit('estadoChat', { abierto: chatAbierto });

    if (chatAbierto) {
      socket.emit('marcarLeidos');
    }
  });
});

$('.form-join').on('submit', function (e) {
  e.preventDefault();
  const name = nameInput.val();
  const room = chatRoom.val();

  if (name && room) {
    socket.emit('entrarCita', { name, cita: room });
  }
});

$('.form-msg').on('submit', function (e) {
  e.preventDefault();
  const messageValue = msgInput.val();
  const name = nameInput.val();
  const room = chatRoom.val();
  socket.emit('message', { name, text: messageValue });
  msgInput.val('');
});

socket.on('actualizarMensajes', (mensajesActualizados) => {
  chatDisplay.empty();

  mensajesActualizados.forEach((data) => {
    const { name, text, time, leido } = data;
    const li = $('<li>').addClass('box');

    if (name === nameInput.val()) {
      li.addClass('has-background-primary-light');
    } else {
      li.addClass('has-background-light');
    }

    if (leido) {
      li.addClass('has-text-grey');
    } else {
      li.addClass('has-text-dark');
    }

    li.html(`
      <div class="content">
        <p>${text}</p>
        <small class="has-text-grey">${time}</small>
      </div>
    `);

    chatDisplay.append(li);
  });

  chatDisplay.scrollTop(chatDisplay[0].scrollHeight);
  mensajes = mensajesActualizados;
  actualizarContadorNoLeidos(mensajes);
});

socket.on('message', (data) => {
  const { name, text, time, leido } = data;
  const li = $('<li>').addClass('box');

  if (name === nameInput.val()) {
    li.addClass('has-background-primary-light');
  } else {
    li.addClass('has-background-light');
  }

  if (leido) {
    li.addClass('has-text-grey');
  } else {
    li.addClass('has-text-dark');
  }

  li.html(`
    <div class="content">
      <p>${text}</p>
      <small class="has-text-grey">${time}</small>
    </div>
  `);

  chatDisplay.append(li);
  chatDisplay.scrollTop(chatDisplay[0].scrollHeight);

  mensajes.push(data);
  actualizarContadorNoLeidos(mensajes);
});

actualizarContadorNoLeidos(mensajes);