import AdvertisingTest from './advertisingTest';
import audioTrackTest from './audioTrackTest';
import captionMetadataTest from './captionMetadataTest';
import CaptionTest from './captionTest';
import ErrorTest from './errorTest';
import LoadingTest from './loadingTest';
import MediaControlsTest from './mediaControlsTest';
import metadataId3Test from './metadataId3Test';
import PlaybackTest from './playbackTest';
import UnloadingTest from './unloadingTest';
import videoQualityTest from './videoQualityTest';
import testTags from '../test-tags.json';
import { tagTestSuite } from '../scripts/tag-test-suite';

export default [
  tagTestSuite(AdvertisingTest, testTags.advertising.name),
  tagTestSuite(CaptionTest, testTags.caption.name),
  captionMetadataTest,
  tagTestSuite(ErrorTest, testTags.error.name),
  tagTestSuite(LoadingTest, testTags.loading.name),
  tagTestSuite(MediaControlsTest, testTags.mediaControls.name),
  tagTestSuite(metadataId3Test, testTags.metadataId3.name),
  tagTestSuite(PlaybackTest, testTags.playback.name),
  tagTestSuite(UnloadingTest, testTags.unloading.name),
  tagTestSuite(audioTrackTest, testTags.audioTrack.name),
  tagTestSuite(videoQualityTest, testTags.videoQuality.name),
];
