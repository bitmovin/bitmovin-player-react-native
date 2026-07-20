## Description
<!-- Describe the problem as detailed as possible -->
<!-- Include any information that may help to review the PR -->

## Changes
<!-- Describe your changes as detailed as possible  -->
<!-- Include any information that may help to review the PR -->

## Checklist
- [ ] 🗒 `CHANGELOG` entry

### Google DAI companion package changes
- [ ] Companion TypeScript build/lint/typecheck completed (`yarn build:google-dai`, `yarn lint:google-dai`, `yarn typecheck:google-dai`)
- [ ] Companion Android and iOS native lint/build validation completed or documented
- [ ] Core-only fixture verified without DAI autolinking or native DAI artifacts
- [ ] DAI-enabled fixture verified with autolinking, pinned native DAI artifacts, and no config plugin
- [ ] Android DAI runtime smoke completed when device access is available or any native SDK compatibility issue documented
- [ ] Peer dependency and native dependency pins verified
