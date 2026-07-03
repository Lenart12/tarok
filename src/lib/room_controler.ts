import { create_default_new_round_settings, gen_id, type GameRoom, type GameState } from './tarok';
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

// Legacy room files may be missing parallel arrays (player_ids, starting_points,
// starting_radelci). Backfill any that are absent or the wrong length.
function normalize_room(room: GameRoom): boolean {
  let changed = false;
  if (room.player_ids === undefined || room.player_ids.length !== room.player_names.length) {
    room.player_ids = room.player_names.map((_, i) => room.player_ids?.[i] ?? gen_id());
    changed = true;
  }
  if (room.starting_points === undefined || room.starting_points.length !== room.player_names.length) {
    room.starting_points = room.player_names.map((_, i) => room.starting_points?.[i] ?? 0);
    changed = true;
  }
  if (room.starting_radelci === undefined || room.starting_radelci.length !== room.player_names.length) {
    room.starting_radelci = room.player_names.map((_, i) => room.starting_radelci?.[i] ?? 0);
    changed = true;
  }
  return changed;
}

export function get_room(room_id: string) {
  try {
    const file_name = `rooms/${room_id}.json`;
    assert_saved(file_name)
    const room = JSON.parse(fs.readFileSync(file_name, 'utf-8')) as GameRoom;
    if (normalize_room(room)) save_room(room);
    return room;
  } catch (error) {
    return undefined;
  }
}

// Legacy state files may have an incomplete `new_round` (e.g. missing
// `osnovno.napoved`), which crashes the room page. Fill in any missing structure.
function normalize_new_round(state: GameState, player_count: number) {
  const def = create_default_new_round_settings(player_count);
  const nr = state.new_round;
  if (nr === undefined || nr === null || typeof nr !== 'object') {
    state.new_round = def;
    return;
  }
  nr.osnovno = { ...def.osnovno, ...(nr.osnovno ?? {}) };
  nr.osnovno.napoved = { ...def.osnovno.napoved, ...(nr.osnovno.napoved ?? {}) };
  nr.rocno = nr.rocno ?? def.rocno;
  nr.klop = nr.klop ?? def.klop;
  nr.opravljanje = nr.opravljanje ?? def.opravljanje;
  if (nr.kontra === undefined) nr.kontra = def.kontra;
}

export function get_state(room_id: string) {
  try {
    const file_name = `rooms/${room_id}-state.json`
    assert_saved(file_name)
    const state = JSON.parse(fs.readFileSync(file_name, 'utf-8')) as GameState;
    const player_count =
      state.starting_points?.length ??
      state.new_round?.rocno?.points_change?.length ??
      state.new_round?.klop?.points?.length ??
      state.rounds?.[0]?.points_change?.length ??
      get_room(room_id)?.player_names.length ??
      4;
    normalize_new_round(state, player_count);
    return state;
  } catch (error) {
    const room = get_room(room_id);
    if (room === undefined) throw new Error('Creating state for room that does not exist ' + room_id);
    const state: GameState = {
      mixer: 0,
      napovedi_open: false,
      obrazlozitev_open: false,
      rounds: [],
      new_round: create_default_new_round_settings(room.player_names.length),
      editing_players: false,
      edit_rows: [],
    };
    save_state(room_id, state);
    return state;
  }
}

export function save_state(room_id: string, state: GameState) {
  save_delayed(`rooms/${room_id}-state.json`, JSON.stringify(state));
}

export function save_room(room: GameRoom) {
  if (!fs.existsSync('rooms')) {
    fs.mkdirSync('rooms');
  }
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

export function create_room(title: string, player_names: string[], starting_points: number[], starting_radelci: number[]) {
  const room = {} as GameRoom;

  room.id = create_room_id();
  room.title = title;
  room.created = Date.now();
  room.player_names = player_names;
  room.player_ids = player_names.map(() => gen_id());
  room.starting_points = starting_points;
  room.starting_radelci = starting_radelci;

  save_room(room);
  console.log(`Created room '${room.id}'`);
  return room;
}
