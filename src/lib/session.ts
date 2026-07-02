import { writable } from 'svelte/store';

export interface SessionAccount {
  id: string;
  email: string;
  display_name: string;
}

export const account = writable<SessionAccount | null>(null);
