import { TestScope } from 'cavy';

export default (spec: TestScope) => {
  spec.describe('cavy', () => {
    spec.it('works', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });
  });
};
