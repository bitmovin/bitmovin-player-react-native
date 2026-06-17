import React, { useEffect, useState } from 'react';
import { Tester, TestHookStore } from 'cavy';
import Specs from '../tests';
import PlayerTestWorld from '../playertesting/PlayerTestWorld';
import TestablePlayer from './TestablePlayer';

const testHookStore = new TestHookStore();
const cavyOnlyTags = process.env.EXPO_PUBLIC_CAVY_ONLY_TAGS?.split(',')
  .map((tag) => tag.trim())
  .filter(Boolean);

function TestableApp(): JSX.Element {
  const playerTestWorld = useState(new PlayerTestWorld())[0];
  useEffect(() => {
    PlayerTestWorld.shared = playerTestWorld;
    return () => {
      PlayerTestWorld.shared = undefined;
    };
  }, [playerTestWorld]);
  return (
    <Tester
      specs={Specs}
      store={testHookStore}
      startDelay={1000}
      waitTime={3000}
      only={cavyOnlyTags?.length ? cavyOnlyTags : undefined}
    >
      <TestablePlayer playerTestWorld={playerTestWorld} />
    </Tester>
  );
}

export default TestableApp;
