import ioClient from 'socket.io-client';
const ENDPOINT = 'ws://ice:5173/';

const socket = ioClient(ENDPOINT);

export const io = socket;
