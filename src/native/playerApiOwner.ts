import type { Player } from '../player';
const owners = new WeakMap<object, Player>();
/** Keep the public player and its JS callback owners reachable while an API handle is retained. @internal */
export function retainPlayerApi(api: object, player: Player): void {
  owners.set(api, player);
}
/** @internal */
export function playerForApi(api: object): Player {
  return owners.get(api)!;
}
