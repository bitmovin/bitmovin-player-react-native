const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const ts = require(process.env.TYPESCRIPT_PATH || 'typescript');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'native-registry-'));
after(() => fs.rmSync(directory, { recursive: true, force: true }));
let registry;

before(() => {
  const program = ts.createProgram(
    [path.resolve(__dirname, '../src/nativeInstanceRegistry.ts')],
    {
      rootDir: path.resolve(__dirname, '../src'),
      outDir: directory,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      skipLibCheck: true,
      types: [],
    }
  );
  const emission = program.emit();
  assert.equal(emission.emitSkipped, false);
  for (const diagnostic of ts
    .getPreEmitDiagnostics(program)
    .concat(emission.diagnostics)) {
    assert.fail(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
  registry = require(path.join(directory, 'nativeInstanceRegistry.js'));
});

function fixture(t) {
  const entries = [];
  const getOrCreate = async (kind, id, factory) => {
    const instance = await registry.getOrCreateAsync(
      kind,
      id,
      async () => factory(),
      () => {}
    );
    entries.push({ kind, id, instance });
    return instance;
  };
  t.after(() => {
    for (const { kind, id, instance } of entries) {
      registry.remove(kind, id, instance);
    }
  });
  return { ...registry, getOrCreate };
}

test('lookups with the same kind and ID reuse their registry entry', async (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const config = { licenseKey: 'first-config' };
  const wrapper = { native: {}, config, isDestroyed: false };
  const first = await getOrCreate('Player', 'shared-player', () => wrapper);
  const alias = await getOrCreate('Player', 'shared-player', () => {
    assert.fail('An alias must not construct another backend');
  });

  assert.equal(first, wrapper);
  assert.equal(alias, first);
  assert.equal(lookup('Player', 'shared-player'), first);
  alias.isDestroyed = true;
  assert.equal(first.isDestroyed, true);
  assert.equal(alias.config, config);
});

test('types and IDs have separate namespaces without delimiter collisions', async (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const player = await getOrCreate('Player', 'same-id', () => ({}));
  const source = await getOrCreate('Source', 'same-id', () => ({}));
  const otherPlayer = await getOrCreate('Player', 'other-id', () => ({}));
  const kindWithSeparator = await getOrCreate('kind:one', 'id', () => ({}));
  const idWithSeparator = await getOrCreate('kind', 'one:id', () => ({}));

  assert.equal(lookup('Player', 'same-id'), player);
  assert.equal(lookup('Source', 'same-id'), source);
  assert.equal(lookup('Player', 'other-id'), otherPlayer);
  assert.notEqual(source, player);
  assert.notEqual(otherPlayer, player);
  assert.notEqual(kindWithSeparator, idWithSeparator);
  assert.equal(lookup('Player', 'missing'), undefined);
  assert.equal(lookup('MissingKind', 'same-id'), undefined);
});

test('removal lets aliases destroy a shared SDK object exactly once', async (t) => {
  const { getOrCreate, lookup, remove } = fixture(t);
  let destructions = 0;
  const wrapper = await getOrCreate('Player', 'destroy-once', () => ({
    native: {
      destroy: () => destructions++,
      release: () => assert.fail('Registry removal must not release Expo'),
    },
  }));
  const alias = await getOrCreate('Player', 'destroy-once', () => ({}));
  const destroy = (instance) => {
    if (remove('Player', 'destroy-once', instance)) {
      instance.native.destroy();
    }
  };

  destroy(alias);
  destroy(wrapper);
  destroy(alias);
  assert.equal(destructions, 1);
  assert.equal(lookup('Player', 'destroy-once'), undefined);
});

test('a stale alias cannot remove a replacement or another kind', async (t) => {
  const { getOrCreate, lookup, remove } = fixture(t);
  const retired = await getOrCreate('Player', 'reused-id', () => ({}));
  const source = await getOrCreate('Source', 'reused-id', () => ({}));
  assert.equal(remove('Player', 'reused-id', retired), true);
  const replacement = await getOrCreate('Player', 'reused-id', () => ({}));

  assert.equal(remove('Player', 'reused-id', retired), false);
  assert.equal(remove('Source', 'reused-id', replacement), false);
  assert.equal(lookup('Player', 'reused-id'), replacement);
  assert.equal(lookup('Source', 'reused-id'), source);
  assert.equal(remove('Player', 'reused-id', replacement), true);
  assert.equal(remove('Player', 'reused-id', replacement), false);
});

test('a constructor failure leaves the ID available for a later retry', async (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const failure = new Error('Native construction failed');
  await assert.rejects(
    () =>
      getOrCreate('Player', 'retry-id', () => {
        throw failure;
      }),
    (error) => error === failure
  );
  assert.equal(lookup('Player', 'retry-id'), undefined);

  const backend = await getOrCreate('Player', 'retry-id', () => ({}));
  assert.equal(lookup('Player', 'retry-id'), backend);
});

test('removal of an unregistered ID is harmless', async (t) => {
  const { remove } = fixture(t);
  assert.equal(remove('Player', 'never-registered', {}), false);
  assert.equal(remove('MissingKind', 'never-registered', {}), false);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('async construction shares one pending promise and publishes only its resolved object', async () => {
  const pending = deferred();
  const backend = {};
  const first = registry.getOrCreateAsync(
    'Async',
    'shared',
    () => pending.promise,
    () => assert.fail()
  );
  const alias = registry.getOrCreateAsync(
    'Async',
    'shared',
    () => assert.fail(),
    () => assert.fail()
  );
  assert.equal(first, alias);
  assert.equal(registry.lookup('Async', 'shared'), undefined);
  assert.equal(registry.lookupPending('Async', 'shared'), first);
  pending.resolve(backend);
  assert.equal(await first, backend);
  assert.equal(registry.lookupPending('Async', 'shared'), undefined);
  assert.equal(registry.lookup('Async', 'shared'), backend);
  registry.remove('Async', 'shared', backend);
});

test('failed async creation clears its pending entry and allows retry', async () => {
  const failure = new Error('creation failed');
  const first = registry.getOrCreateAsync(
    'Async',
    'retry',
    async () => {
      throw failure;
    },
    () => assert.fail()
  );
  await assert.rejects(first, (error) => error === failure);
  assert.equal(registry.lookupPending('Async', 'retry'), undefined);
  const backend = {};
  assert.equal(
    await registry.getOrCreateAsync(
      'Async',
      'retry',
      async () => backend,
      () => assert.fail()
    ),
    backend
  );
  registry.remove('Async', 'retry', backend);
});

test('a skipped factory clears its pending entry without publishing or disposing an object', async () => {
  const first = registry.getOrCreateAsync(
    'Async',
    'skipped',
    async () => undefined,
    () => assert.fail('A skipped factory has no object to dispose')
  );
  assert.equal(registry.lookupPending('Async', 'skipped'), first);
  assert.equal(await first, undefined);
  assert.equal(registry.lookup('Async', 'skipped'), undefined);
  assert.equal(registry.lookupPending('Async', 'skipped'), undefined);

  const backend = {};
  assert.equal(
    await registry.getOrCreateAsync(
      'Async',
      'skipped',
      async () => backend,
      () => assert.fail()
    ),
    backend
  );
  assert.equal(registry.lookup('Async', 'skipped'), backend);
  registry.remove('Async', 'skipped', backend);
});

test('a canceled skipped factory cannot remove a replacement sharing its ID', async () => {
  const pending = deferred();
  const first = registry.getOrCreateAsync(
    'Async',
    'skipped-replacement',
    () => pending.promise,
    () => assert.fail('A skipped factory has no object to dispose')
  );
  assert.equal(registry.remove('Async', 'skipped-replacement', first), true);
  const backend = {};
  await registry.getOrCreateAsync(
    'Async',
    'skipped-replacement',
    async () => backend,
    () => assert.fail()
  );

  pending.resolve(undefined);
  assert.equal(await first, undefined);
  assert.equal(registry.lookup('Async', 'skipped-replacement'), backend);
  assert.equal(
    registry.lookupPending('Async', 'skipped-replacement'),
    undefined
  );
  registry.remove('Async', 'skipped-replacement', backend);
});

test('removing pending creation disposes its eventual object without replacing a newer object', async () => {
  const pending = deferred();
  const old = {};
  const disposed = [];
  const first = registry.getOrCreateAsync(
    'Async',
    'replacement',
    () => pending.promise,
    (value) => disposed.push(value)
  );
  assert.equal(registry.remove('Async', 'replacement', first), true);
  assert.equal(registry.lookupPending('Async', 'replacement'), undefined);
  const replacement = {};
  await registry.getOrCreateAsync(
    'Async',
    'replacement',
    async () => replacement,
    () => assert.fail()
  );
  pending.resolve(old);
  assert.equal(await first, old);
  assert.deepEqual(disposed, [old]);
  assert.equal(registry.lookup('Async', 'replacement'), replacement);
  assert.equal(registry.remove('Async', 'replacement', first), false);
  registry.remove('Async', 'replacement', replacement);
});
