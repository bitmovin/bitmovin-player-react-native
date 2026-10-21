# Cavy summary fixtures

The XML files retain the cases, counts and assertion messages from PRN-282 runs:

- `android-pass.xml`: Android run 39559415262, 64 passing cases.
- `ios-failure.xml`: iOS run 39559427710, 52 passing cases and two source-event assertion failures.

Downloaded reports were reserialized and the runner hostname removed. These
fixtures exercise the pinned Cavy CLI format, which omits the aggregate `tests`
attribute. They are reporting fixtures, not evidence that a later revision passes
native tests.
