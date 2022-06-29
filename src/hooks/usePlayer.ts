import { useRef } from 'react';
import { Player, PlayerConfig } from '../player';

/**
 * React hook that creates and returns a reference to a `Player` instance
 * that can be used inside any component.
 */
export function usePlayer(config: PlayerConfig): Player {
  return useRef(new Player(config)).current;
}
