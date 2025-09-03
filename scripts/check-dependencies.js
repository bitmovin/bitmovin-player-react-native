#!/usr/bin/env node

/**
 * Check for required app-level dependencies and fail installation if they're missing.
 * This elevates peer dependency warnings to hard errors.
 */

// Fail install if required app-level deps are missing
const required = ['expo', 'expo-crypto'];
const has = (name) => {
  try {
    require.resolve(`${name}/package.json`, { paths: [process.cwd()] });
    return true;
  } catch {
    return false;
  }
};
const missing = required.filter((r) => !has(r));
if (missing.length) {
  console.error(
    `\n[bitmovin-player-react-native] Missing required deps in your app: ${missing.join(', ')}\n` +
      `Install: npx expo install ${missing.join(' ')}\n`
  );
  process.exit(1);
}
