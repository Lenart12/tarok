import { create_default_new_round_settings, type GameRoom, type GameState } from './tarok';
import fs from 'fs';

interface DelayedSave {
  timeout: NodeJS.Timeout,
  cb?: () => void,
}

const save_timeout: { [file_name: string]: DelayedSave } = {};

function save_delayed(file_name: string, data: string) {
  clearTimeout(save_timeout[file_name]?.timeout);

  const cb = () => {
    save_timeout[file_name].cb = undefined;
    fs.writeFileSync(file_name, data);
    console.log('Saving ', file_name);
  }
  save_timeout[file_name] = {
    cb: cb,
    timeout: setTimeout(cb, 5000),
  }
}

function assert_saved(file_name: string) {
  if (save_timeout[file_name] !== undefined) {
    clearTimeout(save_timeout[file_name].timeout);
    save_timeout[file_name].cb?.()
  }
}

export function get_room(room_id: string) {
  try {
    const file_name = `rooms/${room_id}.json`;
    assert_saved(file_name)
    return JSON.parse(fs.readFileSync(file_name, 'utf-8')) as GameRoom;
  } catch (error) {
    return undefined;
  }
}

export function get_state(room_id: string) {
  try {
    const file_name = `rooms/${room_id}-state.json`
    assert_saved(file_name)
    return JSON.parse(fs.readFileSync(file_name, 'utf-8')) as GameState;
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

export function save_state(room_id: string, state: GameState) {
  save_delayed(`rooms/${room_id}-state.json`, JSON.stringify(state));
}

export function save_room(room: GameRoom) {
  fs.writeFileSync(`rooms/${room.id}.json`, JSON.stringify(room));
}

function create_room_id() {
  const adjectives_male = [
    'altruisticen', 'ambiciozen', 'analiticen', 'atletski', 'blag', 'delaven', 'diplomatski', 'domiseln', 'dostojanstven', 'duhovit',
    'eleganten', 'empaticen', 'energicen', 'fleksibilen', 'gibcen', 'hitri', 'igriv', 'inovativen', 'iskren', 'karizmaticen', 'lep',
    'ljubec', 'logicen', 'marljiv', 'milosten', 'miroljuben', 'mocan', 'mogocen', 'natancen', 'nategnjen', 'navdusen', 'neodvisen',
    'nesebican', 'neustrasen', 'objektiven', 'ocarljiv', 'odgovoren', 'odlocen', 'odpuscajoc', 'optimisticen', 'organiziran', 'pameten',
    'plemenit', 'podporen', 'pogumen', 'ponizen', 'posten', 'potrpezljiv', 'pozoren', 'pozrtvovalen', 'prakticen', 'pravicen', 'predan',
    'previden', 'priden', 'prijazen', 'prilagodljiv', 'proaktiven', 'puhast', 'pustolovski', 'radoziv', 'razigran', 'razumevajoc',
    'romanticen', 'samozavesten', 'sarmanten', 'sijoc', 'skrben', 'skromen', 'socuten', 'spodbuden', 'sposoben', 'spostljiv', 'spreten',
    'srckan', 'strasten', 'svoboden', 'ucljiv', 'uspesen', 'ustvarjalen', 'velik', 'velikodusen', 'vesel', 'vesten', 'vitalen', 'vodstveni',
    'vzdrzljiv', 'vztrajen', 'zabaven', 'zanesljiv', 'zascitniski', 'zdrav', 'zvest',
  ];
  const adjectives_female = [
    'ambiciozna', 'atletska', 'blagorodna', 'delavna', 'domiselna', 'dostojanstvena', 'duhovita', 'elegantna', 'empaticna', 'energicna',
    'fleksibilna', 'gibcna', 'graciozna', 'hitra', 'igriva', 'inovativna', 'inteligentna', 'iskrena', 'krhka', 'lepa', 'ljubeca', 'ljubka',
    'marljiva', 'miroljubna', 'mocna', 'natancna', 'neodvisna', 'nesebicna', 'nezna', 'ocarljiva', 'odgovorna', 'odpuscajoca', 'optimisticna',
    'organizirana', 'pametna', 'podpoorna', 'pogumna', 'ponizna', 'postena', 'potrpezljiva', 'pozorna', 'pravicna', 'predana', 'previdna',
    'pridna', 'prijazna', 'prilagodljiva', 'privlacna', 'proaktivna', 'puhasta', 'radoziva', 'razumevajoca', 'romanticna', 'samozavestna',
    'sarmantna', 'skrbna', 'skromna', 'socutna', 'spodbudna', 'spostljiva', 'sramezljiva', 'srcna', 'strastna', 'ucljiva', 'udobna', 'uspesna',
    'ustvarjalna', 'velikodusna', 'vesela', 'vestna', 'vitalna', 'vodstvena', 'vzdrzljiva', 'zabavna', 'zanesljiva', 'zascitniska', 'zdrava',
    'zgovorna', 'zvesta',
  ];
  const animals_male = [
    'aligator', 'delfin', 'drozg', 'golob', 'iguan', 'jastog', 'jebac', 'jez', 'kameleon', 'kanarcek', 'kenguru', 'kit', 'klop', 'komar',
    'konj', 'kos', 'krokodil', 'kuscar', 'labod', 'lev', 'ligenj', 'medved', 'metulj', 'morskikonj', 'morskiprasicek', 'netopir', 'nosorog',
    'orel', 'pajek', 'papagaj', 'pelikan', 'pes', 'pingvin', 'polz', 'prasic', 'ptic', 'rak', 'salamander', 'scinkavec', 'scurek', 'skorpijon',
    'slon', 'sokol', 'svizec', 'termit', 'tiger', 'tjuln', 'volk', 'volkodlak', 'vrabec', 'zajec',
  ];
  const animals_female = [
    'bolha', 'cebela', 'hobotnica', 'kaca', 'koala', 'kobila', 'kokos', 'kokoska', 'koza', 'krastaca', 'krava', 'lisica', 'macka', 'meduza',
    'medvedka', 'morskazvezda', 'mravlja', 'muha', 'opica', 'ovca', 'panda', 'papiga', 'pcela', 'pikapolonica', 'sinica', 'sova', 'stenica',
    'svinja', 'vrana', 'zaba', 'zebra', 'zelva', 'zirafa', 'zlataribica',
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
