import React, { useEffect, useState } from 'react';
import { Tester, TestHookStore } from 'cavy';
import Specs from '../tests';
import PlayerWorld from '../playertesting/PlayerWorld';
import TestablePlayer from './TestablePlayer';

const testHookStore = new TestHookStore();

function TestableApp(): JSX.Element {
  const playerWorld = useState(new PlayerWorld())[0];
  useEffect(() => {
    PlayerWorld.shared = playerWorld;
    return () => {
      PlayerWorld.shared = undefined;
    };
  }, [playerWorld]);
  return (
    <Tester
      specs={Specs}
      store={testHookStore}
      startDelay={1000}
      waitTime={3000}
    >
      <TestablePlayer playerWorld={playerWorld} />
    </Tester>
  );
}

export default TestableApp;
