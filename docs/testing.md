# Choosing tests

Choose the test layer from the behavior you need to prove. Use a JS unit test
when the result depends on JavaScript logic. Use Cavy system tests when the
result depends on the running app, Expo bridge, or native Player SDK. A focused
native test can cover a decoder or completer directly when an appropriate
native test target is available.

## What each layer proves

JS unit tests run in Node without a simulator or emulator. They can run real
TypeScript code while replacing the Expo boundary with a controlled mock. Use
them for callback invocation, synchronous throws and rejected promises,
fallback selection, payload routing, and handling bridge-promise failures.
Assertions about arguments submitted to a mock prove the JS submission only.

An integration test checks cooperating components across a chosen boundary.
A test using real JS modules and a mocked bridge may cover their JS integration,
but it does not cross the real Expo/native boundary. In this guide, these
isolated Node checks are grouped with JS unit tests.

The suites in `integration_test/` run a real Expo test app with the native
Player SDK through Cavy. They are system-level tests, despite the directory's
historical name: they exercise the assembled app and SDK. Use them to verify
real serialization, platform events, and playback. A focused native test can
isolate native conversion or completion rules; Cavy is needed when the claim
also includes delivery across Expo or SDK behavior in the app.

## Decision examples

| Behavior to verify                                                                            | Choose                          | Evidence to assert                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| A preprocessing callback resolves to a transformed request or response                        | JS unit                         | Correct callback arguments and transformed payload submitted to the bridge mock                                      |
| A callback throws synchronously or returns a rejected promise                                 | JS unit                         | JS selects the intended fallback and handles the failure                                                             |
| An event belongs to another `nativeId`, or a request/response completion ID must be forwarded | JS unit                         | Foreign events are ignored; matching events route the correct kind, ID, and payload                                  |
| The bridge completion promise rejects                                                         | JS unit                         | JS handles rejection according to the explicit fixture state; submission counts alone do not prove native completion |
| Missing fields, null values, or encoded bodies reach a native decoder                         | Focused native test and/or Cavy | Real conversion accepts or rejects the payload as specified; Cavy for the actual Expo boundary                       |
| A native completer receives a duplicate or stale ID, or a decoded result                      | Focused native test and/or Cavy | Native completion, cleanup, and error behavior; Cavy if SDK resumption is part of the claim                          |
| The Player emits events after loading, playing, unloading, or failing                         | Cavy system                     | Actual platform SDK events and observable player state                                                               |
| A transformed manifest, segment, or license request must still allow playback                 | Both                            | Unit tests cover JS transformation/fallback branches; Cavy proves the native round trip and resulting playback       |

For bridge-error cases, state whether the fixture models rejection before or after
completion, and track attempts separately from modeled completions. A rejection
alone does not reveal real native state. Native recovery guarantees need evidence
at the native boundary.

Use both layers when a change combines JS branching with a native contract.
Keep the detailed callback/error matrix in unit tests, then add focused system
cases for the changed boundary and observable result on each affected platform.
A unit pass alone cannot close a native regression. A system happy path alone
does not cover every callback failure branch.

## Existing tests and commands

Run commands from the repository root after the documented development setup.

### JS and repository tooling

```sh
node --test scripts/test-network-preprocessing.js
yarn test:plugin
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
```

The [network preprocessing tests](../scripts/test-network-preprocessing.js)
use Node's test runner, TypeScript transpilation, and a mocked Expo module.
They need installed root dependencies, including TypeScript, but no native
build or Player license. They exercise the real JS handlers for request and
response routing, callback success/failure, absent callbacks, and mocked
completion rejection. They do not run a native decoder or completer.

`yarn test:plugin` builds and tests the config plugin. The Python command tests
repository automation. Neither establishes Player runtime behavior. There is
no root `yarn test` command that runs all these layers.

### Cavy system tests

Follow the [test app setup](../integration_test/README.md#setup), including the
gitignored license-key environment file. These commands require an iOS
simulator or Android emulator and the native test app:

```sh
yarn integration-test list-tags
yarn integration-test test:ios --tags playback,unloading
yarn integration-test test:android --tags playback
yarn integration-test test:ios
yarn integration-test test:android
```

Omit `--tags` to run all suites for that platform. For a new suite, follow
[Adding new tests](../CONTRIBUTING.md#adding-new-tests) to register its selector
and supported platforms. Check the current selector list instead of guessing a
tag. Current Cavy support is limited to iOS simulators and Android emulators;
real-device and tvOS behavior require separate validation.

## Keeping unit fixtures maintainable

Use the existing Node test runner and declared TypeScript compiler. Follow the
network suite: emit test fixtures with the compiler, then let Node load them
normally. Avoid custom VM loaders, handwritten module resolution, and private
Node loader hooks. Reuse an existing fixture approach before adding new setup.

Keep the real JS behavior under test and mock only the boundary needed for the
case. Isolate mutable module state and register cleanup for temporary files and
mocks. Compiler emission for a fixture does not replace the separate CI
typecheck. Keep mock assumptions explicit and tied to the claim being tested.

## Limits and unknowns

A bridge mock does not establish native serialization, decoder acceptance,
native completion, SDK resumption, event timing, or playback. A resolved mock
promise is only the fixture's chosen result. A rejected mock promise does not
prove that a particular payload causes a real native rejection.

Treat payload shapes, defaults, nullability, byte encoding, duplicate/stale
completion handling, and platform differences as unverified until supported by
the relevant native implementation or contract and tests at that boundary.
Do not turn synthetic fixture behavior into a public native contract. If a
focused native test target or required runtime fixture is unavailable, record
that gap and the required follow-up instead of treating a mock as equivalent.
Simulator/emulator results also leave device-specific behavior unverified.

## CI and reporting

When adding tests, wire their command into the relevant CI job and include
workflow path filters that trigger it for changes to both the implementation
and tests. Confirm execution from the job's steps and results. A test file,
suite registration, typecheck, or successful app build alone is insufficient.

Currently, [TypeScript CI](../.github/workflows/ci-typescript.yml) runs the network
preprocessing script and plugin tests. The
[integration-test workflow](../.github/workflows/integration-tests.yml) is a
manually dispatched stub and does not run Cavy. Do not report Cavy coverage from
that workflow's success. Any automated Cavy coverage needs actual runner steps,
environment setup, and results for the selected platforms and suites.

Report the command, selected suites, platform, result, and remaining gaps.
Excluded or skipped cases are **excluded, not passed**. Cases not executed are
**not run**. A selected suite passing on iOS proves nothing about excluded
suites or Android. Record why coverage was omitted, such as a platform filter,
missing fixture, or unavailable environment, and identify the remaining check.
