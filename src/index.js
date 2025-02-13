'use strict';

module.exports = {
  bootstrap({ strapi }) {
    const { Server } = require('socket.io');
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: "http://localhost:1337",
        methods: ["GET", "POST"]
      }
    });

    strapi.io = io;

    let ciudadanos = {};
    let mensajes = {};
    let estadoChat = {}; 

    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado');

      socket.on('estadoChat', (data) => {
        const { abierto } = data;
        estadoChat[socket.id] = abierto; 
        console.log(`Chat del cliente ${socket.id} está ${abierto ? 'abierto' : 'cerrado'}`);
      });

      socket.emit('message', buildMsg('Admin', '¡Bienvenido al chat!'));

      socket.on('entrarCita', (data) => {
        const { name, cita } = data;
      
        socket.join(cita);
        ciudadanos[socket.id] = { name, cita };
      
        const mensajeSistema = buildMsg('Admin', `${name} se ha unido a la cita`, new Date().toISOString(), false);
      
        if (!mensajes[cita]) {
          mensajes[cita] = [];
        }
      
        const receptores = Object.entries(ciudadanos)
          .filter(([id, ciudadano]) => ciudadano.cita === cita && id !== socket.id) 
          .map(([id]) => id);
      
        const chatReceptorAbierto = receptores.some((id) => estadoChat[id]);
      
        if (chatReceptorAbierto) {
          mensajeSistema.leido = true;
        }
      
        mensajes[cita].push(mensajeSistema);
      
        io.to(cita).emit('message', mensajeSistema);
      
        if (mensajeSistema.leido) {
          io.to(cita).emit('actualizarMensajes', mensajes[cita]);
        }
      });

      socket.on('message', (data) => {
        const { name, text } = data;
        const cita = ciudadanos[socket.id]?.cita;
        const newMessage = buildMsg(name, text, new Date().toISOString(), false); 

        if (!mensajes[cita]) {
          mensajes[cita] = [];
        }

        const receptores = Object.entries(ciudadanos)
          .filter(([id, ciudadano]) => ciudadano.cita === cita && id !== socket.id) 
          .map(([id]) => id);

        const chatReceptorAbierto = receptores.some((id) => estadoChat[id]);

        if (chatReceptorAbierto) {
          newMessage.leido = true;
        }

        mensajes[cita].push(newMessage);

        io.to(cita).emit('message', newMessage);

        if (newMessage.leido) {
          io.to(cita).emit('actualizarMensajes', mensajes[cita]);
        }
      });

      socket.on('marcarLeidos', () => {
        const cita = ciudadanos[socket.id]?.cita;
        if (mensajes[cita]) {
          mensajes[cita] = mensajes[cita].map((msg) => ({
            ...msg,
            leido: true
          }));
      
          io.to(cita).emit('actualizarMensajes', mensajes[cita]);
        }
      });

      socket.on('disconnect', () => {
        const ciudadano = ciudadanos[socket.id];
        if (ciudadano) {
          io.to(ciudadano.cita).emit('message', buildMsg('Admin', `${ciudadano.name} ha abandonado la cita`));

          delete ciudadanos[socket.id];
          delete estadoChat[socket.id];

          io.to(ciudadano.cita).emit('userList', {
            ciudadanos: Object.values(ciudadanos).filter((c) => c.cita === ciudadano.cita),
          });
        }
      });
    });

    function buildMsg(name, text, timestamp = new Date().toISOString(), leido = false) {
      return {
        name,
        text,
        time: new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(timestamp)),
        leido
      };
    }
  }
};