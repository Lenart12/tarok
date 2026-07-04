import { Server } from 'socket.io';
import type * as http from 'node:http';
import { get_room, get_state, save_room, save_state } from './room_controler';
import { prune_claims } from './claims';
import { schedule_recompute } from './rating';

export default function inject_socketio(server: http.Server) {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('tarok:update-state', (state, room_id) => {
      save_state(room_id, state);
      console.log(socket.id, 'updates state for room_id', room_id);
      socket.to(room_id).emit('tarok:new-state', state);
      // Ratings are recomputed from persisted files (not this payload), debounced.
      schedule_recompute();
    });
    socket.on('tarok:update-room', (room, room_id) => {
      save_room(room);
      prune_claims(room_id, room.player_ids ?? []);
      console.log(socket.id, 'updates room', room_id);
      socket.to(room_id).emit('tarok:new-room', room);
    });
    socket.on('tarok:claims-updated', (room_id) => {
      socket.to(room_id).emit('tarok:claims-updated');
    });
    socket.on('tarok:join-room', (room_id) => {
      console.log(socket.id, 'joined', room_id);
      socket.join(room_id);
      socket.emit('tarok:new-state', get_state(room_id));
      const room = get_room(room_id);
      if (room !== undefined) socket.emit('tarok:new-room', room);
    });
    socket.on('tarok:leave-room', (room_id) => {
      console.log(socket.id, 'left', room_id);
      socket.leave(room_id);
    });
    socket.on('tarok:new-round', (room_id) => {
      socket.to(room_id).emit('tarok:new-round')
    });
  });

  console.log('SocketIO injected');
}
