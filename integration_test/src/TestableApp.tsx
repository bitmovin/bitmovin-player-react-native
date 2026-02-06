import React, { useEffect, useState } from 'react';
import { Tester, TestHookStore } from 'cavy';
import Specs from '../tests';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import TestablePlayer from './TestablePlayer';
import TestableMultiPlayer from './TestableMultiPlayer';

const testHookStore = new TestHookStore();

function TestableApp(): JSX.Element {
  const playerTestWorld = useState(new PlayerTestWorld())[0];
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    PlayerTestWorld.shared = playerTestWorld;
    playerTestWorld.onReRender = () =>
      setRenderCount((count) => count + 1);
    return () => {
      PlayerTestWorld.shared = undefined;
      playerTestWorld.onReRender = undefined;
    };
  }, [playerTestWorld]);
  return (
    <Tester
      specs={Specs}
      store={testHookStore}
      startDelay={1000}
      waitTime={3000}
    >
      {playerTestWorld.viewMode === 'multi' ? (
        <TestableMultiPlayer
          playerTestWorld={playerTestWorld}
          renderCount={renderCount}
          isSwapped={playerTestWorld.isSwapped}
        />
      ) : (
        <TestablePlayer
          playerTestWorld={playerTestWorld}
          renderCount={renderCount}
        />
      )}
    </Tester>
  );
}

export default TestableApp;
