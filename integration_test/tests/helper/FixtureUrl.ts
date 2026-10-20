import { Image } from 'react-native';

export function fixtureUrl(path: string): string {
  const asset = Image.resolveAssetSource(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../../assets/images/icon.png')
  );
  const origin = asset.uri.match(/^https?:\/\/[^/]+/)?.[0];
  if (!origin) {
    throw new Error('Cavy fixtures require an HTTP Metro asset URL');
  }
  return `${origin}/cavy-fixtures/${path}`;
}
