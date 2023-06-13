import { get_room } from '$lib/room_controler.js';
import { error, json } from '@sveltejs/kit';


export function GET({params}) {
    const room = get_room(params.room_id)
    if (room === undefined) throw error(404, 'Room does not exist');
    return json(room);
}