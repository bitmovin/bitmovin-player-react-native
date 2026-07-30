import { TestScope } from 'cavy';

type TestPlatform = 'android' | 'ios';
type TestSuite = (spec: TestScope) => void | Promise<void>;

export const availableTestTags: Array<{
  name: string;
  platforms: TestPlatform[];
}>;

export const cueMetadataSelector: string;

export function createSpecs(): TestSuite[];
