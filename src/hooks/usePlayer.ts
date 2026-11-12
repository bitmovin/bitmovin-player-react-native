import { useRef } from 'react';
import { Player } from '../player';
import type { PlayerConfig } from '../playerConfig';

/**
 * React hook that creates and returns a reference to a `Player` instance
 * that can be used inside any component. The ref belongs to this hook call,
 * not to a global registry. It creates one Player for the component and reads
 * its initial configuration only once.
 */
export function usePlayer(config?: PlayerConfig): Player {
  const player = useRef<Player | null>(null);
  if (player.current === null) {
    player.current = new Player(config);
  }
  return player.current;
}
