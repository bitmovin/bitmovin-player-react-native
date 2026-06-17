# Android Cue Geometry Follow-Ups

## Current Split

Keep WebVTT-style cue geometry separate from Android-native cue metadata.

The current feature should expose cross-platform subtitle cue fields through:

- `html`
- `vtt.line`
- `vtt.snapToLines`
- `vtt.lineAlign`
- `vtt.position`
- `vtt.positionAlign`
- `vtt.size`
- `vtt.align`
- `vtt.vertical`

These fields are normalized from Android cue data into the public `SubtitleCueVtt` shape.

## Deferred Android-Native Metadata

Do not add the following Android SDK fields to `SubtitleCueVtt`:

- `bitmapHeight`
- `windowColor`
- raw enum values such as `LineTypeNumber`, `AnchorTypeMiddle`, `VerticalTypeRightToLeft`
- raw Android field names such as `lineType`, `lineAnchor`, `positionAnchor`, `textAlignment`

These are native implementation details or caption rendering metadata, not WebVTT positioning fields. If they are needed, expose them through a separate typed API instead of mixing them into `vtt`.

## Proposed Next Steps

1. Finish and validate the current WebVTT-normalized event shape for Android.
2. Keep Android-native cue metadata out of this feature unless a concrete use case requires it.
3. If native-only metadata is needed, design a separate field such as `nativeCue` or a narrower typed object for image/style data.
4. Add tests that verify `vtt` omits unset geometry and maps Android cue values to WebVTT-style values.
5. Avoid exposing raw Android enum names in the public JavaScript API.

## Why This Branch Has More Android Converter Code

The Android-only branch adds a small helper that copies native cue fields directly into the event map. That is compact because it performs almost no translation:

- read a native field
- skip unset sentinel values
- write the same concept to a top-level JavaScript field

This branch has more code in `JsonConverter.kt` because it normalizes native Android data into the cross-platform `SubtitleCueVtt` contract:

- converts fractional Android values into percentages
- converts `lineType` into `snapToLines`
- maps Android anchors into WebVTT alignment strings
- maps Android vertical writing modes into WebVTT values
- emits `"auto"` where the public API expects an automatic VTT value
- omits the entire `vtt` object when no VTT-related geometry is present

The extra code is not additional feature breadth; it is the adapter layer that keeps the JavaScript API stable and platform-neutral.
