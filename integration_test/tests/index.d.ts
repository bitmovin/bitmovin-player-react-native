import { TestScope } from 'cavy';

type TestPlatform = 'android' | 'ios';
type TestSuite = (spec: TestScope) => void | Promise<void>;

export const availableTestTags: Array<{
  name: string;
  platforms: TestPlatform[];
}>;

export const testSelectors: Readonly<Record<string, string>>;

export function createSpecs(): TestSuite[];
