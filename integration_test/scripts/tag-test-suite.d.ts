import { TestScope } from 'cavy';

type TestSuite = (spec: TestScope) => void | Promise<void>;

export function tagTestSuite(
  registerSuite: TestSuite,
  defaultTag: string
): TestSuite;
