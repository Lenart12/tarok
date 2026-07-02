// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Account } from '$lib/auth';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      account: Account | undefined;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
