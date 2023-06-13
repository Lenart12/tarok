<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
    import { io } from '$lib/game_connection_client';
    import ScoreCounter from './ScoreCounter.svelte';
	import type { GameState } from '$lib/tarok';
    export let data;

    export let game_state: GameState | undefined = undefined;

    onMount(async () => {
        if (browser) {
            const rooms = JSON.parse(localStorage.getItem('rooms') || '[]') as string[];
            if (rooms.indexOf(data.room.id) === -1)
                rooms.push(data.room.id);   
            localStorage.setItem('rooms', JSON.stringify(rooms));

            if (!io.connected) {
                io.on('connect', () => {
                    console.log('WS connected, joined room', data.room.id)
                    io.emit('tarok:join-room', data.room.id)
                });
            } else {
                io.emit('tarok:join-room', data.room.id)
            }
            
            io.on('tarok:new-state', new_state => {
                console.log('WS New state', new_state)
                game_state = new_state || {};
            });
        }
    })

    onDestroy(() => {
        if (browser) {
            io.emit('tarok:leave-room', data.room.id)
        }
    })

    function update_state() {
        if (game_state === undefined) return;
        io.emit('tarok:update-state', game_state, data.room.id);
    }

    function mixer_left() {
        if (game_state === undefined) return;
        game_state.mixer--;
        if (game_state.mixer < 0) game_state.mixer = data.room.player_names.length - 1;
        update_state();
    }

    function mixer_right() {
        if (game_state === undefined) return;
        game_state.mixer++;
        if (game_state.mixer >= data.room.player_names.length) game_state.mixer = 0;
        update_state();
    }

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

{/if}

<h2>Štetje</h2>
<ScoreCounter />

<style>
    .mixer {
        background-color: aquamarine;
    }
</style>
