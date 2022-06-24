import { useRef, useEffect } from 'react';
import { Player, PlayerConfig } from '../player';

export function usePlayer(config: PlayerConfig): Player {
  const playerRef = useRef(new Player(config));
  useEffect(() => {
    playerRef.current?.init();
  }, []);
  return playerRef.current;
}
