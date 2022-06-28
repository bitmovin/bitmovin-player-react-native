import { useRef } from 'react';
import { Player, PlayerConfig } from '../player';

export function usePlayer(config: PlayerConfig): Player {
  return useRef(new Player(config)).current;
}
