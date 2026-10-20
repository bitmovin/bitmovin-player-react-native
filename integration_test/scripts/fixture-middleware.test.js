const assert = require('node:assert/strict');
const fs = require('node:fs');
const { once } = require('node:events');
const http = require('node:http');
const { createRequire } = require('node:module');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const licensePath = '/cavy-fixtures/drm/license-403';

function metroMiddleware(previous) {
  const configRequire = createRequire(
    path.join(__dirname, '../metro.config.js')
  );
  const config = {
    resolver: {},
    transformer: {},
    server: { enhanceMiddleware: previous },
  };
  const context = {
    __dirname: path.resolve(__dirname, '..'),
    module: { exports: {} },
    require(name) {
      if (name === 'expo/metro-config') {
        return { getDefaultConfig: () => config };
      }
      return configRequire(name);
    },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../metro.config.js'), 'utf8'),
    context
  );
  return context.module.exports.server.enhanceMiddleware;
}

async function serve(t, middleware) {
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.writeHead(404);
      res.end('Not found');
    });
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return (requestPath, method = 'POST') =>
    new Promise((resolve, reject) => {
      const request = http.request(
        {
          hostname: '127.0.0.1',
          port: server.address().port,
          path: requestPath,
          method,
        },
        (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () =>
            resolve({
              status: response.statusCode,
              headers: response.headers,
              body: Buffer.concat(chunks).toString(),
            })
          );
        }
      );
      request.on('error', reject);
      request.end(method === 'POST' ? Buffer.from([0, 1, 255, 42]) : undefined);
    });
}

test('Metro serves a fixed 403 for repeated binary license POSTs', async (t) => {
  const enhance = metroMiddleware();
  assert.equal(typeof enhance, 'function');
  const request = await serve(
    t,
    enhance((_req, _res, next) => next())
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await request(`${licensePath}?attempt=${attempt}`);
    assert.equal(response.status, 403);
    assert.equal(response.body, 'Forbidden\n');
    assert.equal(response.headers['content-type'], 'text/plain; charset=utf-8');
    assert.equal(response.headers['content-length'], '10');
    assert.equal(response.headers['cache-control'], 'no-store');
  }
});

test('fixture routing preserves existing Metro middleware and next', async (t) => {
  const marker = {};
  const calls = [];
  const enhance = metroMiddleware((middleware, server) => {
    assert.equal(server, marker);
    return (req, res, next) => {
      calls.push(`${req.method} ${req.url}`);
      middleware(req, res, next);
    };
  });
  const request = await serve(
    t,
    enhance((_req, _res, next) => next(), marker)
  );
  assert.equal((await request(licensePath)).status, 403);
  assert.deepEqual(calls, []);
  for (const [requestPath, method] of [
    [licensePath, 'GET'],
    [licensePath, 'PUT'],
    [`${licensePath}/extra`, 'POST'],
    ['/other/cavy-fixtures/drm/license-403', 'POST'],
    ['/cavy-fixtures/missing', 'POST'],
    ['/index.bundle?platform=android', 'GET'],
    ['/assets/icon.png', 'GET'],
  ]) {
    assert.equal((await request(requestPath, method)).status, 404);
    assert.equal(calls.at(-1), `${method} ${requestPath}`);
  }
  assert.equal(calls.length, 7);
});

test('serializes the real middleware response and routes without listening', async () => {
  let delegated = 0;
  const server = {};
  const middleware = metroMiddleware((metro, actualServer) => {
    assert.equal(actualServer, server);
    return (req, res, next) => {
      delegated++;
      metro(req, res, next);
    };
  })((_req, _res, next) => next(), server);
  for (const [method, requestPath, status] of [
    ['POST', licensePath, 403],
    ['POST', `${licensePath}?retry=2`, 403],
    ['GET', licensePath, 404],
    ['POST', `${licensePath}/extra`, 404],
    ['GET', '/index.bundle?platform=android', 404],
  ]) {
    const socket = new PassThrough();
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = requestPath;
    req.push(Buffer.from([0, 1, 255, 42]));
    req.push(null);
    const res = new http.ServerResponse(req);
    const chunks = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    res.assignSocket(socket);
    const finished = once(res, 'finish');
    middleware(req, res, () => {
      res.writeHead(404);
      res.end('Not found');
    });
    await finished;
    const response = Buffer.concat(chunks).toString();
    assert.match(response, new RegExp(`^HTTP/1.1 ${status} `));
    if (status === 403) {
      assert.match(response, /Content-Type: text\/plain; charset=utf-8\r\n/i);
      assert.match(response, /Content-Length: 10\r\n/i);
      assert.match(response, /Cache-Control: no-store\r\n/i);
      assert.ok(response.endsWith('\r\n\r\nForbidden\n'));
    }
    socket.destroy();
  }
  assert.equal(delegated, 3);
});

function loadTypeScript(file, dependencies) {
  assert.ok(fs.existsSync(path.resolve(__dirname, file)), `${file} must exist`);
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, file), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  );
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

test('DRM fixture uses the resolved Metro origin only when requested', () => {
  let assetUri = 'http://10.0.2.2:19007/assets/icon.png?hash=abc';
  let resolutions = 0;
  const helper = loadTypeScript('../tests/helper/FixtureUrl.ts', {
    'react-native': {
      Image: {
        resolveAssetSource() {
          resolutions++;
          return { uri: assetUri };
        },
      },
    },
    '../../assets/images/icon.png': 1,
  });
  const { Sources } = loadTypeScript('../tests/helper/Sources.ts', {
    'bitmovin-player-react-native': {
      SourceType: { DASH: 'dash', HLS: 'hls' },
    },
    './FixtureUrl': helper,
  });
  assert.equal(resolutions, 0);
  assert.equal(
    Sources.widevineDrmWithBrokenLicense.drmConfig.widevine.licenseUrl,
    `http://10.0.2.2:19007${licensePath}`
  );
  assetUri = 'https://metro.example.test:8443/assets/icon.png';
  assert.equal(
    helper.fixtureUrl('drm/license-403'),
    `https://metro.example.test:8443${licensePath}`
  );
  assetUri = 'file:///app/icon.png';
  assert.throws(() => helper.fixtureUrl('drm/license-403'), /Metro/);
});

test('Android DRM listens for SourceError and preserves network assertions', async () => {
  let observedEvent;
  let assertions = 0;
  const source = {};
  const errorEvent = {
    code: 1,
    message: 'DRM license request failed',
    data: {
      httpResponse: {
        status: 403,
        url: `http://10.0.2.2:8081${licensePath}`,
        request: { method: 'POST' },
      },
    },
  };
  const { default: register } = loadTypeScript('../tests/errorTest.ts', {
    'react-native': { Platform: { OS: 'android' } },
    '../playertesting': {
      EventType: { SourceError: 'source-error', PlayerError: 'player-error' },
      startPlayerTest: (_config, run) => run(),
      callPlayerAndExpectEvent: (load, event) => {
        observedEvent = event;
        load({ load: (actual) => assert.equal(actual, source) });
        return errorEvent;
      },
    },
    './helper/Sources': { Sources: { widevineDrmWithBrokenLicense: source } },
    './helper/Expect': {
      expect(value) {
        return {
          toBeDefined() {
            assertions++;
            assert.notEqual(value, undefined);
          },
          toBe(expected) {
            assertions++;
            assert.equal(value, expected);
          },
        };
      },
    },
  });
  let run;
  register({
    describe: (_name, body) => body(),
    it: (_name, body) => (run = body),
  });
  await run();
  assert.equal(observedEvent, 'source-error');
  assert.equal(assertions, 7);
});
