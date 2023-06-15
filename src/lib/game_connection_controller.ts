import { Server } from 'socket.io';
import type * as http from 'node:http';
import { get_state, save_state } from './room_controler';

export default function inject_socketio(server: http.Server) {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('tarok:update-state', (state, room_id) => {
      save_state(room_id, state);
      console.log(socket.id, 'updates state for room_id', room_id);
      socket.to(room_id).emit('tarok:new-state', state);
    });
    socket.on('tarok:join-room', (room_id) => {
      console.log(socket.id, 'joined', room_id);
      socket.join(room_id);
      socket.emit('tarok:new-state', get_state(room_id));
    });
    socket.on('tarok:leave-room', (room_id) => {
      console.log(socket.id, 'left', room_id);
      socket.leave(room_id);
    });
  });

  console.log('SocketIO injected');
}
