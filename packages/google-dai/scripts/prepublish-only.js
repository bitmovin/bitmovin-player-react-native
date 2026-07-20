#!/usr/bin/env node

const allowPublishEnv = 'BITMOVIN_GOOGLE_DAI_ALLOW_PUBLISH';

if (process.env[allowPublishEnv] === '1') {
  process.exit(0);
}

console.error(
  'Publishing @bitmovin/player-react-native-google-dai is blocked by default.'
);
console.error(
  'Complete Android runtime compatibility validation, confirm the iOS DAI SDK contract,'
);
console.error(
  'complete runtime fixture validation, and assign release/maintenance ownership first.'
);
console.error(
  `Set ${allowPublishEnv}=1 only after the release checklist is complete.`
);
process.exit(1);
