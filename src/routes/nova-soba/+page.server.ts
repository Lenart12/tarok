import { create_room } from '$lib/room_controler.js';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    let title = data.get('title') as string | null;

    if (title === null) {
      return fail(400, { title: 'missing' });
    }

    title = title.trim();
    if (title.length === 0) {
      return fail(400, { title: 'empty' });
    }

    const players = [];
    for (let i = 0; data.get(`player_${i}`) !== null && i < 5; i++) {
      const player = (data.get(`player_${i}`) as string).trim();
      if (player.length === 0) {
        return fail(400, { player: 'empty', id: i });
      }
      players.push(data.get(`player_${i}`) as string);
    }

    const room = create_room(title, players);

    throw redirect(303, `/${room.id}`);
  },
};
