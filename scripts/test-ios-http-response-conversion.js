const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test(
  'iOS HTTP response conversion accepts integral Expo numbers',
  {
    skip: process.platform !== 'darwin',
  },
  (t) => {
    const source = fs.readFileSync(
      path.join(__dirname, '../ios/RCTConvert+BitmovinPlayer.swift'),
      'utf8'
    );
    const decoders = ['httpRequest', 'httpResponse'].map((name) => {
      const match = source.match(
        new RegExp('^    static func ' + name + '\\([\\s\\S]*?^    }', 'm')
      );
      assert.ok(match, 'Missing production decoder: ' + name);
      return match[0];
    });
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), 'http-response-decoder-')
    );
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const fixture = path.join(root, 'decoder.swift');
    // Compile the production decoder functions. Only SDK model storage and
    // React's URL conversion are replaced; Foundation numeric casts remain real.
    fs.writeFileSync(
      fixture,
      [
        'import Foundation',
        'struct HttpRequest {',
        '  let url: URL',
        '  let method: String',
        '  var headers: [String: String] = [:]',
        '  var body: Data? = nil',
        '}',
        'struct HttpResponse {',
        '  let request: HttpRequest',
        '  let url: URL',
        '  let status: Int',
        '  let headers: [String: String]',
        '  let body: Data?',
        '}',
        'enum RCTConvert {',
        '  static func nsurl(_ value: Any?) -> URL? {',
        '    guard let value = value as? String else { return nil }',
        '    return URL(string: value)',
        '  }',
        ...decoders,
        '}',
        'let request: [String: Any] = [',
        '  "url": "https://example.com/manifest.m3u8",',
        '  "method": "GET", "headers": ["Accept": "*/*"]',
        ']',
        'let cases: [(String, Any, Int?)] = [',
        '  ("Swift Int", 200, 200),',
        '  ("Expo Double", Double(200), 200),',
        '  ("Expo error status", Double(404), 404),',
        '  ("NSNumber", NSNumber(value: 201), 201),',
        '  ("String", "200", nil),',
        '  ("Fractional", Double(200.5), nil),',
        '  ("NaN", Double.nan, nil),',
        '  ("Infinity", Double.infinity, nil),',
        '  ("Boolean", true, nil)',
        ']',
        'for (name, status, expected) in cases {',
        '  let response: [String: Any] = [',
        '    "request": request, "url": request["url"]!,',
        '    "status": status, "headers": ["Content-Type": "application/vnd.apple.mpegurl"],',
        '    "body": Data("#EXTM3U".utf8).base64EncodedString()',
        '  ]',
        '  let decoded = RCTConvert.httpResponse(response)',
        '  if decoded?.status != expected {',
        '    fputs("FAIL: \\(name): expected \\(String(describing: expected)), got \\(String(describing: decoded?.status))\\n", stderr)',
        '    exit(1)',
        '  }',
        '  if expected != nil && decoded?.body != Data("#EXTM3U".utf8) {',
        '    fputs("FAIL: response body changed\\n", stderr)',
        '    exit(1)',
        '  }',
        '}',
        'print("\\(cases.count) decoder cases passed")',
      ].join('\n')
    );
    const output = execFileSync('xcrun', ['swift', fixture], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    assert.match(output, /9 decoder cases passed/);
  }
);
