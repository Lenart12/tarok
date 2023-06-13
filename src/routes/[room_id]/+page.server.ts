import { get_room } from '$lib/room_controler.js'
import { error } from '@sveltejs/kit';

export function load({params}) {
    const room = get_room(params.room_id);

    if (room === undefined)
        throw error(404, 'Soba ne obstaja');

    return {
        room: room
    }
}