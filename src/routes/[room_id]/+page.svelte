<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
    import { io } from '$lib/game_connection_client';
    import ScoreCounter from './ScoreCounter.svelte';
	import type { GameState } from '$lib/tarok';
    export let data;

    export let game_state: GameState | undefined = undefined;
    let old_game_state: GameState | undefined = undefined;


    onMount(async () => {
        if (browser) {
            const rooms = JSON.parse(localStorage.getItem('rooms') || '[]') as string[];
            if (rooms.indexOf(data.room.id) === -1)
                rooms.push(data.room.id);   
            localStorage.setItem('rooms', JSON.stringify(rooms));

            const on_connected = () => {
                console.log('WS connected, joined room', data.room.id)
                io.emit('tarok:join-room', data.room.id)
            }

            if (io.connected) on_connected();
            io.on('connect', on_connected);
            io.on('reconnect', on_connected);
            io.on('disconnect', () => game_state = undefined)            
            io.on('tarok:new-state', new_state => {
                console.log('WS New state', new_state)
                old_game_state = structuredClone(new_state)
                game_state = new_state;
            });
        }
    })

    onDestroy(() => {
        if (browser) {
            io.emit('tarok:leave-room', data.room.id)
            io.removeAllListeners()
        }
    })

    function update_state() {
        if (game_state === undefined || JSON.stringify(game_state) === JSON.stringify(old_game_state)) return;
        old_game_state = structuredClone(game_state)
        io.emit('tarok:update-state', game_state, data.room.id);
    }

    function mixer_left() {
        if (game_state === undefined) return;
        game_state.mixer--;
        if (game_state.mixer < 0) game_state.mixer = data.room.player_names.length - 1;
    }

    function mixer_right() {
        if (game_state === undefined) return;
        game_state.mixer++;
        if (game_state.mixer >= data.room.player_names.length) game_state.mixer = 0;
    }

    $: game_state !== undefined && update_state()
</script>

<h1>{data.room.title}</h1>

{#if game_state !== undefined}

<h2>Točke</h2>

<button on:click={mixer_left}>&lt;</button>
Mešalec
<button on:click={mixer_right}>&gt;</button>

<table>
    <tr>

    </tr>
        {#each data.room.player_names as player_name, i}
        <th class:mixer="{i == game_state.mixer}">
                {player_name}
        </th>
        {/each}
    <tr>
        {#each data.room.player_names as player_name}
            <td>Rad: 0</td>         
        {/each}
    </tr>
</table>

<h2>Nova runda</h2>

{#each data.room.player_names as player_name, i}
    <input type="radio" bind:group={game_state.mixer} value={i} id="mixer_{i}">
    <label for="mixer_{i}">{player_name}</label>
{/each}


{:else}
Nalaganje povezave
{/if}

<h2>Štetje</h2>
<ScoreCounter />

<style>
    .mixer {
        background-color: aquamarine;
    }
</style>
