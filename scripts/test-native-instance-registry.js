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
  const getOrCreate = (kind, id, factory) => {
    const instance = registry.getOrCreate(kind, id, factory);
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

test('lookups with the same kind and ID reuse their registry entry', (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const config = { licenseKey: 'first-config' };
  const wrapper = { native: {}, config, isDestroyed: false };
  const first = getOrCreate('Player', 'shared-player', () => wrapper);
  const alias = getOrCreate('Player', 'shared-player', () => {
    assert.fail('An alias must not construct another backend');
  });

  assert.equal(first, wrapper);
  assert.equal(alias, first);
  assert.equal(lookup('Player', 'shared-player'), first);
  alias.isDestroyed = true;
  assert.equal(first.isDestroyed, true);
  assert.equal(alias.config, config);
});

test('types and IDs have separate namespaces without delimiter collisions', (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const player = getOrCreate('Player', 'same-id', () => ({}));
  const source = getOrCreate('Source', 'same-id', () => ({}));
  const otherPlayer = getOrCreate('Player', 'other-id', () => ({}));
  const kindWithSeparator = getOrCreate('kind:one', 'id', () => ({}));
  const idWithSeparator = getOrCreate('kind', 'one:id', () => ({}));

  assert.equal(lookup('Player', 'same-id'), player);
  assert.equal(lookup('Source', 'same-id'), source);
  assert.equal(lookup('Player', 'other-id'), otherPlayer);
  assert.notEqual(source, player);
  assert.notEqual(otherPlayer, player);
  assert.notEqual(kindWithSeparator, idWithSeparator);
  assert.equal(lookup('Player', 'missing'), undefined);
  assert.equal(lookup('MissingKind', 'same-id'), undefined);
});

test('removal lets aliases destroy a shared SDK object exactly once', (t) => {
  const { getOrCreate, lookup, remove } = fixture(t);
  let destructions = 0;
  const wrapper = getOrCreate('Player', 'destroy-once', () => ({
    native: {
      destroy: () => destructions++,
      release: () => assert.fail('Registry removal must not release Expo'),
    },
  }));
  const alias = getOrCreate('Player', 'destroy-once', () => ({}));
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

test('a stale alias cannot remove a replacement or another kind', (t) => {
  const { getOrCreate, lookup, remove } = fixture(t);
  const retired = getOrCreate('Player', 'reused-id', () => ({}));
  const source = getOrCreate('Source', 'reused-id', () => ({}));
  assert.equal(remove('Player', 'reused-id', retired), true);
  const replacement = getOrCreate('Player', 'reused-id', () => ({}));

  assert.equal(remove('Player', 'reused-id', retired), false);
  assert.equal(remove('Source', 'reused-id', replacement), false);
  assert.equal(lookup('Player', 'reused-id'), replacement);
  assert.equal(lookup('Source', 'reused-id'), source);
  assert.equal(remove('Player', 'reused-id', replacement), true);
  assert.equal(remove('Player', 'reused-id', replacement), false);
});

test('a constructor failure leaves the ID available for a later retry', (t) => {
  const { getOrCreate, lookup } = fixture(t);
  const failure = new Error('Native construction failed');
  assert.throws(
    () =>
      getOrCreate('Player', 'retry-id', () => {
        throw failure;
      }),
    (error) => error === failure
  );
  assert.equal(lookup('Player', 'retry-id'), undefined);

  const backend = getOrCreate('Player', 'retry-id', () => ({}));
  assert.equal(lookup('Player', 'retry-id'), backend);
});

test('removal of an unregistered ID is harmless', (t) => {
  const { remove } = fixture(t);
  assert.equal(remove('Player', 'never-registered', {}), false);
  assert.equal(remove('MissingKind', 'never-registered', {}), false);
});
