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

    const starting_points = [];
    for (let i = 0; data.get(`starting_points_${i}`) !== null && i < 5; i++) {
      const sp = (data.get(`starting_points_${i}`) as string).trim();
      if (sp.length === 0) {
        return fail(400, { starting_points: 'empty', id: i });
      }
      const sp_num = Number(sp);
      if (isNaN(sp_num)) {
        return fail(400, { starting_points: 'nan', id: i });
      }
      starting_points.push(sp_num);
    }

    const starting_radelci = [];
    for (let i = 0; data.get(`starting_radelci_${i}`) !== null && i < 5; i++) {
      const sr = (data.get(`starting_radelci_${i}`) as string).trim();
      if (sr.length === 0) {
        return fail(400, { starting_radelci: 'empty', id: i });
      }
      const sr_num = Number(sr);
      if (isNaN(sr_num)) {
        return fail(400, { starting_radelci: 'nan', id: i });
      }
      if (sr_num < 0) {
        return fail(400, { starting_radelci: 'negative', id: i });
      }
      starting_radelci.push(sr_num);
    }

    const room = create_room(title, players, starting_points, starting_radelci);

    throw redirect(303, `/${room.id}`);
  },
};
