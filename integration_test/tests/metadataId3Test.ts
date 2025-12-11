import { TestScope } from 'cavy';
import {
  callPlayer,
  EventType,
  expectEvent,
  loadSourceConfig,
  startPlayerTest,
} from '../playertesting';
import {
  Id3MetadataEntry,
  MetadataParsedEvent,
  MetadataType,
} from 'bitmovin-player-react-native';
import { expect } from './helper/Expect';
import { Sources } from './helper/Sources';
import { Platform } from 'react-native';

const expectAndroidFrameShape = (frame: Id3MetadataEntry) => {
  if (frame.platform !== 'android') {
    expect(
      frame.platform,
      'Non-android ID3 frame found in android serialization test'
    ).toBe('android');
    return;
  }

  expect(frame.metadataType, 'metadataType').toBe(MetadataType.ID3);
  expect(frame.id, 'frame id').toBeDefined();
  expect(frame.frameType, 'frameType').toBeDefined();

  switch (frame.frameType) {
    case 'text':
      expect(frame.value, 'text frame value').toBeDefined();
      expect(typeof frame.value, 'text frame value type').toBe('string');
      break;
    case 'url':
      expect(frame.url, 'url frame url').toBeDefined();
      expect(typeof frame.url, 'url frame url type').toBe('string');
      break;
    case 'binary':
      expect(frame.data, 'binary frame data').toBeDefined();
      expect(typeof frame.data, 'binary frame data type').toBe('string');
      break;
    case 'apic':
      expect(frame.mimeType, 'apic mimeType').toBeDefined();
      expect(frame.pictureData, 'apic pictureData').toBeDefined();
      break;
    case 'priv':
      expect(frame.owner, 'priv owner').toBeDefined();
      expect(frame.privateData, 'priv data').toBeDefined();
      break;
    case 'geob':
      expect(frame.mimeType, 'geob mimeType').toBeDefined();
      expect(frame.filename, 'geob filename').toBeDefined();
      expect(frame.data, 'geob data').toBeDefined();
      break;
    case 'chapter': {
      expect(frame.chapterId, 'chapter id').toBeDefined();
      expect(frame.timeRange, 'chapter timeRange').toBeDefined();
      const { start, end } = frame.timeRange || {};
      const legacyStart = (frame as any).startTimeMs;
      const legacyEnd = (frame as any).endTimeMs;
      if (start !== undefined) {
        expect(typeof start, 'chapter timeRange.start type').toBe('number');
      }
      if (end !== undefined) {
        expect(typeof end, 'chapter timeRange.end type').toBe('number');
      }
      expect(frame.subFrames, 'chapter subFrames').toBeInstanceOf(Array);
      frame.subFrames.forEach(expectAndroidFrameShape);
      if (legacyStart !== undefined && start !== undefined) {
        expect(legacyStart, 'chapter startTimeMs vs timeRange.start').toBe(start);
      }
      if (legacyEnd !== undefined && end !== undefined) {
        expect(legacyEnd, 'chapter endTimeMs vs timeRange.end').toBe(end);
      }
      break;
    }
    case 'chapterToc':
      expect(frame.elementId, 'chapterToc elementId').toBeDefined();
      expect(typeof frame.isRoot, 'chapterToc isRoot type').toBe('boolean');
      expect(typeof frame.isOrdered, 'chapterToc isOrdered type').toBe(
        'boolean'
      );
      expect(frame.children, 'chapterToc children').toBeInstanceOf(Array);
      expect(frame.subFrames, 'chapterToc subFrames').toBeInstanceOf(Array);
      frame.subFrames.forEach(expectAndroidFrameShape);
      break;
    default:
      expect(frame.frameType, 'unknown frameType should be string').toBeDefined();
  }
};

const expectIosFrameShape = (frame: Id3MetadataEntry) => {
  if (frame.platform !== 'ios') {
    expect(
      frame.platform,
      'Non-iOS ID3 frame found in iOS serialization test'
    ).toBe('ios');
    return;
  }

  expect(frame.metadataType, 'metadataType').toBe(MetadataType.ID3);
  if (frame.id !== undefined) {
    expect(typeof frame.id, 'frame id type').toBe('string');
  }
  if (frame.value !== undefined) {
    expect(typeof frame.value, 'frame value type').toBe('string');
  }
  if (frame.rawValue !== undefined) {
    expect(typeof frame.rawValue, 'rawValue type').toBe('object');
    if (frame.rawValue.stringValue !== undefined) {
      expect(typeof frame.rawValue.stringValue, 'rawValue stringValue type').toBe(
        'string'
      );
    }
    if (frame.rawValue.numberValue !== undefined) {
      expect(typeof frame.rawValue.numberValue, 'rawValue numberValue type').toBe(
        'number'
      );
    }
    if (frame.rawValue.dateValue !== undefined) {
      expect(typeof frame.rawValue.dateValue, 'rawValue dateValue type').toBe(
        'string'
      );
    }
    if (frame.rawValue.dataValue !== undefined) {
      expect(typeof frame.rawValue.dataValue, 'rawValue dataValue type').toBe(
        'string'
      );
    }
  }
  if (frame.relativeTimeRange !== undefined) {
    const { start, end } = frame.relativeTimeRange;
    if (start !== undefined) {
      expect(typeof start, 'relativeTimeRange.start type').toBe('number');
    }
    if (end !== undefined) {
      expect(typeof end, 'relativeTimeRange.end type').toBe('number');
    }
  }
  if (frame.duration !== undefined) {
    expect(typeof frame.duration, 'duration type').toBe('number');
  }
  if (frame.extendedLanguageTag !== undefined) {
    expect(typeof frame.extendedLanguageTag, 'extendedLanguageTag type').toBe(
      'string'
    );
  }
  if (frame.extraAttributes !== undefined) {
    expect(frame.extraAttributes, 'extraAttributes should not be null').toNotBeNull();
    expect(typeof frame.extraAttributes, 'extraAttributes type').toBe('object');
  }
};

export default (spec: TestScope) => {
  spec.describe('ID3 metadata serialization (Android)', () => {
    spec.it('emits Android ID3 frames with expected shape', async () => {
      // Gate to Android since the shape expectations are Android-specific.
      if (Platform.OS !== 'android') {
        console.warn('Skipping Android ID3 metadata shape test on non-Android platform');
        return;
      }

      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.id3MetadataHls, 30);
        await callPlayer(async (player) => {
          player.play();
        });

        const metadataParsed = await expectEvent<MetadataParsedEvent>(
          EventType.MetadataParsed,
          45
        );

        expect(metadataParsed.metadataType, 'metadataType').toBe(
          MetadataType.ID3
        );
        expect(metadataParsed.metadata, 'metadata payload').toBeDefined();
        expect(metadataParsed.metadata.entries, 'metadata entries').toBeInstanceOf(
          Array
        );
        expect(
          metadataParsed.metadata.entries.length,
          'metadata entries length'
        ).toBeGreaterThan(0);

        if (metadataParsed.metadataType !== MetadataType.ID3) {
          throw new Error(
            `Expected ID3 metadata type, got ${metadataParsed.metadataType}`
          );
        }

        metadataParsed.metadata.entries.forEach(expectAndroidFrameShape);
      });
    });
  });

  spec.describe('ID3 metadata serialization (iOS)', () => {
    spec.it('emits iOS ID3 frames with expected shape', async () => {
      // Gate to iOS since the shape expectations are iOS-specific.
      if (Platform.OS !== 'ios') {
        console.warn('Skipping iOS ID3 metadata shape test on non-iOS platform');
        return;
      }

      await startPlayerTest({}, async () => {
        await loadSourceConfig(Sources.id3MetadataHls, 30);
        await callPlayer(async (player) => {
          player.play();
        });

        const metadataParsed = await expectEvent<MetadataParsedEvent>(
          EventType.MetadataParsed,
          45
        );

        if (metadataParsed.metadataType !== MetadataType.ID3) {
          throw new Error(
            `Expected ID3 metadata type, got ${metadataParsed.metadataType}`
          );
        }

        expect(metadataParsed.metadata, 'metadata payload').toBeDefined();
        expect(metadataParsed.metadata.entries, 'metadata entries').toBeInstanceOf(
          Array
        );
        expect(
          metadataParsed.metadata.entries.length,
          'metadata entries length'
        ).toBeGreaterThan(0);

        metadataParsed.metadata.entries.forEach(expectIosFrameShape);
      });
    });
  });
};
