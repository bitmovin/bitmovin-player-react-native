declare module 'cavy' {
  import React from 'react';
  export interface TestHook {
    (name: string): (component: any) => any;
  }

  export class TestHookStore {
    get: (name: string) => any;
    set: (name: string, component: any) => void;
    constructor();
  }

  export interface TestScope {
    describe: (name: string, fn: () => void) => void;
    it: (name: string, fn: () => Promise<void>) => void;
    beforeEach: (fn: () => void) => void;
    afterEach: (fn: () => void) => void;
  }

  export interface TesterProps {
    specs: Array<(spec: TestScope) => void>;
    store: TestHookStore;
    waitTime?: number;
    startDelay?: number;
    clearAsyncStorage?: boolean;
    reporter?: (report: any) => void;
    children?: React.ReactNode;
  }

  export class Tester extends React.Component<TesterProps> {}

  export function useCavy(): TestHook;

  export function clearAsync(): Promise<void>;
  export function press(element: any): Promise<void>;
  export function fillIn(element: any, text: string): Promise<void>;
  export function exists(element: any): Promise<boolean>;
  export function notExists(element: any): Promise<boolean>;
  export function findBy(testID: string): Promise<any>;
  export function pause(duration: number): Promise<void>;

  export function wrap(component: any): any;
  export default wrap;
}
