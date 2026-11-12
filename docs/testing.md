# Choosing tests

Choose the test layer from the behavior you need to prove. Use a JS unit test
when the result depends on JavaScript logic. Use Cavy system tests when the
result depends on the running app, Expo bridge, or native Player SDK. A focused
native test can cover a decoder or completer directly when an appropriate
native test target is available.

## What each layer proves

JS unit tests run in Node without a simulator or emulator. They can run real
TypeScript code while replacing the Expo boundary with a controlled mock. Use
them for aliases, Source ownership, event subscriptions, view attachment and
JavaScript handler adapters. Assertions about original configuration objects and
functions submitted to a mock prove JS submission only. Native invocation, DTO
conversion, fallback and cancellation require native checks.

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

| Behavior to verify                                                            | Choose                          | Evidence to assert                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Original config functions reach a native constructor                          | JS unit                         | The original objects and function references submitted to the boundary double                  |
| A native-invoked callback throws or returns a rejected Promise                | Focused native test and/or Cavy | The native adapter selects the original SDK value and the SDK operation completes              |
| A callback receives its original receiver and current configured function     | Focused native test and/or Cavy | The actual native call preserves this and follows the current callback property                |
| A native callback result cannot be converted                                  | Focused native test and/or Cavy | Native fallback, cleanup and completion are checked at the adapter boundary                    |
| Missing fields, null values, or encoded bodies reach a native decoder         | Focused native test and/or Cavy | Real conversion accepts or rejects the payload as specified; Cavy for the actual Expo boundary |
| A per-call completion receives a duplicate, late, or decoded result           | Focused native test and/or Cavy | Native completion, cleanup, and error behavior; Cavy if SDK resumption is part of the claim    |
| The Player emits events after loading, playing, unloading, or failing         | Cavy system                     | Actual platform SDK events and observable player state                                         |
| A transformed manifest, segment, or license request must still allow playback | Focused native test and/or Cavy | The actual native round trip preserves converted values and allows the SDK to resume playback  |

For completion-error cases, state whether the fixture models failure before or after
completion, and track attempts separately from modeled completions. A thrown call
alone does not reveal real native state. Native recovery guarantees need evidence
at the native boundary.

Use both layers when a change combines JS branching with a native contract.
Keep JavaScript branching in unit tests. Check native callback errors,
fallbacks and completion rules with focused native tests, then use system cases
for the changed boundary and observable result on each affected platform.
A unit pass alone cannot close a native regression. A system happy path alone
does not cover every callback failure branch.

## Existing tests and commands

Run commands from the repository root after the documented development setup.

### JS and repository tooling

```sh
node --test scripts/test-shared-object-compatibility.js
yarn test:plugin
python3 -m unittest discover -s .github/scripts -p 'test_*.py'
```

The [SharedObject compatibility](../scripts/test-shared-object-compatibility.js)
suite checks public TS aliases, Source reuse, original configuration/function
submission, callback adapters and failure propagation against controlled native
doubles. Configuration functions now cross the native boundary directly; the
old JS token dispatcher and its completion-error matrix no longer exist.

The `network` Cavy suite covers real request/response preprocessing, callback
failure fallbacks and destruction while a callback remains pending. Focused native
checks must cover conversion, cancellation and late completion. Do not
replace those checks with a JS mock of native scheduling or fallback logic.

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
yarn integration-test test:ios --tags shared-object-lifecycle
yarn integration-test test:android --tags shared-object-lifecycle
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

Treat payload shapes, defaults, nullability, byte encoding, duplicate/late
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
preprocessing script, SharedObject and offline compatibility tests, and plugin
tests. The [integration-test workflow](../.github/workflows/integration-tests.yml) is a
manually dispatched stub and does not run Cavy. Do not report Cavy coverage from
that workflow's success. Any automated Cavy coverage needs actual runner steps,
environment setup, and results for the selected platforms and suites.

Report the command, selected suites, platform, result, and remaining gaps.
Excluded or skipped cases are **excluded, not passed**. Cases not executed are
**not run**. A selected suite passing on iOS proves nothing about excluded
suites or Android. Record why coverage was omitted, such as a platform filter,
missing fixture, or unavailable environment, and identify the remaining check.
