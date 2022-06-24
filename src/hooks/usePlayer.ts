import { useRef } from 'react';
import { Player, PlayerConfig } from '../player';

export function usePlayer(config: PlayerConfig) {
  return useRef(new Player(config)).current;
}
