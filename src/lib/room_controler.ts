import { create_default_new_round_settings, type GameRoom, type GameState } from './tarok';
import fs from 'fs';

export function get_room(room_id: string) {
  try {
    return JSON.parse(fs.readFileSync(`rooms/${room_id}.json`, 'utf-8')) as GameRoom;
  } catch (error) {
    return undefined;
  }
}

export function get_state(room_id: string) {
  try {
    return JSON.parse(fs.readFileSync(`rooms/${room_id}-state.json`, 'utf-8')) as GameState;
  } catch (error) {
    const room = get_room(room_id);
    if (room === undefined) throw new Error('Creating state for room that does not exist ' + room_id);
    const state: GameState = {
      mixer: 0,
      rounds: [],
      new_round: create_default_new_round_settings(room.player_names.length),
    };
    save_state(room_id, state);
    return state;
  }
}

const save_timeout: { [file_name: string]: NodeJS.Timeout } = {};
function save_delayed(file_name: string, data: string) {
  clearInterval(save_timeout[file_name]);

  save_timeout[file_name] = setTimeout(() => {
    fs.writeFileSync(file_name, data);
    console.log('Saving ', file_name);
  }, 5000);
}

export function save_state(room_id: string, state: GameState) {
  save_delayed(`rooms/${room_id}-state.json`, JSON.stringify(state));
}

export function save_room(room: GameRoom) {
  fs.writeFileSync(`rooms/${room.id}.json`, JSON.stringify(room));
}

function create_room_id() {
  const adjectives_male = [
    'velik',
    'mocan',
    'puhast',
    'sijoc',
    'hitri',
    'miroljuben',
    'ucljiv',
    'igriv',
    'neustrasen',
    'zvest',
    'lep',
    'plemenit',
    'mogocen',
    'srckan',
    'prijazen',
    'previden',
    'potrpezljiv',
    'razigran',
    'pozrtvovalen',
    'pameten',
  ];
  const adjectives_female = [
    'puhasta',
    'hitra',
    'ljubka',
    'udobna',
    'elegantna',
    'vzdrzljiva',
    'zvesta',
    'igriva',
    'miroljubna',
    'nezna',
    'previdna',
    'prijazna',
    'graciozna',
    'sramezljiva',
    'ucljiva',
    'radoziva',
    'ustvarjalna',
    'zgovorna',
    'prilagodljiva',
    'skrbna',
  ];
  const animals_male = ['lev', 'konj', 'orel', 'ptic', 'tiger', 'medved', 'volk', 'slon', 'svizec', 'kos'];
  const animals_female = [
    'svinja',
    'koza',
    'kokos',
    'ovca',
    'kokoska',
    'krava',
    'pcela',
    'macka',
    'kobila',
    'opica',
    'medvedka',
    'kokos',
  ];

  let room_name = '';
  do {
    let adjectives, animals;
    if (Math.random() < 0.5) {
      adjectives = adjectives_male;
      animals = animals_male;
    } else {
      adjectives = adjectives_female;
      animals = animals_female;
    }
    const sample = (array: string[]) => array[Math.floor(Math.random() * array.length)];

    const room_number = Math.round(Math.random() * 9999);
    room_name = `${sample(adjectives)}${sample(animals)}${String(room_number).padStart(4, '0')}`;
  } while (get_room(room_name) !== undefined);

  return room_name;
}

export function create_room(title: string, player_names: string[]) {
  const room = {} as GameRoom;

  room.id = create_room_id();
  room.title = title;
  room.created = Date.now();
  room.player_names = player_names;

  save_room(room);
  console.log(`Created room '${room.id}'`);
  return room;
}
