<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
    import ScoreCounter from './ScoreCounter.svelte';
    export let data;

    onMount(async () => {
        if (browser) {
            const rooms = JSON.parse(localStorage.getItem('rooms') || '[]') as string[];
            if (rooms.indexOf(data.room.id) === -1)
                rooms.push(data.room.id);   
            localStorage.setItem('rooms', JSON.stringify(rooms));
        }
    })
</script>

<h1>{data.room.title}</h1>

<h2>Točke</h2>
<table>
    <tr>

    </tr>
        {#each data.room.player_names as player_name}
            <th>{player_name}</th>         
        {/each}
    <tr>
        {#each data.room.player_names as player_name}
            <td>Rad: 0</td>         
        {/each}
    </tr>
</table>

<h2>Nova runda</h2>

<h2>Štetje</h2>
<ScoreCounter />
