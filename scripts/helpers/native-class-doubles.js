const { EventEmitter } = require('node:events');
const assert = require('node:assert/strict');

// Controlled JS boundary doubles only. SDK scheduling, decoding and playback are
// established by Cavy, not by the behavior modeled in this fixture.
const peers = new WeakMap();
function controlFor(peer) {
  // A test actuator may inspect a facade's private peer; native arguments below must already be raw.
  peer = peers.has(peer) ? peer : (peer?.native ?? peer);
  const state = peers.get(peer);
  if (!state) return Promise.resolve(peer);
  state.ready ??= Promise.resolve()
    .then(() => state.factory(...state.args))
    .then((control) => {
      state.control = control;
      if (!control.events) Object.assign(control, emitterFor(state));
      return control;
    });
  return state.ready;
}
function emitterFor(state) {
  return {
    addListener(event, listener) {
      state.emitter.on(event, listener);
      return { remove: () => state.emitter.off(event, listener) };
    },
    emit(event, payload) {
      state.emitter.emit(event, payload);
    },
  };
}
function nativeClass(factory, methods, { synchronous = false } = {}) {
  class BoundaryObject {
    constructor(...args) {
      const state = { args, factory, emitter: new EventEmitter() };
      peers.set(this, state);
      if (synchronous) {
        state.control = factory(...args);
        if (!state.control.events)
          Object.assign(state.control, emitterFor(state));
        state.ready = Promise.resolve(state.control);
      }
    }
    addListener(event, listener) {
      return emitterFor(peers.get(this)).addListener(event, listener);
    }
    emit(event, payload) {
      peers.get(this).emitter.emit(event, payload);
    }
    get sdkSource() {
      return peers.get(this).control?.sdkSource;
    }
    get configSnapshot() {
      return peers.get(this).control?.configSnapshot;
    }
    static fromControl(control) {
      const peer = Object.create(this.prototype);
      const state = {
        control,
        ready: Promise.resolve(control),
        emitter: new EventEmitter(),
      };
      peers.set(peer, state);
      if (!control.events) Object.assign(control, emitterFor(state));
      return peer;
    }
  }
  for (const [name, target] of Object.entries(methods)) {
    BoundaryObject.prototype[name] = async function (...args) {
      const state = peers.get(this);
      if (name === 'destroy') {
        if (!state.ready) {
          state.ready = Promise.reject(
            new Error('Destroyed before SDK creation')
          );
          void state.ready.catch(() => {});
          return;
        }
        try {
          await controlFor(this);
        } catch {
          return;
        }
      }
      const control = await controlFor(this);
      if (name === 'loadSource' || name === 'loadOfflineContent')
        assert.ok(peers.has(args[0]), `${name} requires a raw Expo peer`);
      if (name === 'loadPlaylist')
        for (const source of args[0])
          assert.ok(
            peers.has(source),
            'loadPlaylist requires raw Source peers'
          );
      if (name === 'getSource')
        for (const source of args[0] ?? [])
          assert.ok(
            peers.has(source),
            'getSource requires raw known Source peers'
          );
      for (const arg of args) {
        if (peers.has(arg)) await controlFor(arg);
        if (Array.isArray(arg))
          await Promise.all(
            arg.filter((peer) => peers.has(peer)).map(controlFor)
          );
      }
      return typeof target === 'function'
        ? target(control, args)
        : control[target](...args);
    };
  }
  return BoundaryObject;
}
function installNativeClasses(modules) {
  const playerMethods = Object.fromEntries(
    [
      'play',
      'pause',
      'seek',
      'timeShift',
      'mute',
      'unmute',
      'setVolume',
      'getVolume',
      'isPlaying',
      'isPaused',
      'isMuted',
      'isLive',
      'getTimeShift',
      'getMaxTimeShift',
      'getPlaybackSpeed',
      'setPlaybackSpeed',
      'isAd',
      'setMaxSelectableBitrate',
      'isAirPlayActive',
      'isAirPlayAvailable',
      'showAirPlayTargetPicker',
      'isCastAvailable',
      'isCasting',
      'castVideo',
      'castStop',
      'skipAd',
      'canPlayAtPlaybackSpeed',
      'loadSource',
      'getSource',
      'loadOfflineContent',
      'getAudioTrack',
      'getAvailableAudioTracks',
      'setAudioTrack',
      'getSubtitleTrack',
      'getAvailableSubtitles',
      'setSubtitleTrack',
      'scheduleAd',
      'getThumbnail',
      'getVideoQuality',
      'getAvailableVideoQualities',
      'setVideoQuality',
      'destroy',
      'unload',
    ].map((key) => [key, key])
  );
  Object.assign(playerMethods, {
    getCurrentTime: 'currentTime',
    getDuration: 'duration',
    getSource: async (control, args) => {
      const source = await control.getSource(...args);
      const known = (args[0] ?? []).find(
        (peer) => peer.sdkSource === source?.sdkSource
      );
      if (known) return known;
      return source && !peers.has(source)
        ? modules.SourceModule.Source.fromControl(source)
        : source;
    },
    loadPlaylist: (control, [sources, options]) =>
      control.loadPlaylist(sources, options),
  });
  modules.PlayerModule ??= {};
  modules.PlayerModule.Player = nativeClass(
    (...args) => modules.PlayerModule.create(...args),
    playerMethods
  );
  modules.SourceModule ??= {};
  modules.SourceModule.Source = nativeClass(
    (...args) => modules.SourceModule.create(...args),
    {
      duration: 'duration',
      isActive: 'isActive',
      isAttachedToPlayer: 'isAttachedToPlayer',
      loadingState: 'loadingState',
      metadata: 'getMetadata',
      setMetadata: 'setMetadata',
      getThumbnail: 'getThumbnail',
      drmFairplayRenewExpiringLicense: 'drmFairplayRenewExpiringLicense',
    }
  );
  const groups = {
    BufferApi: {
      getLevel: 'getBufferLevel',
      setTargetLevel: 'setBufferTargetLevel',
    },
    AnalyticsApi: {
      sendCustomDataEvent: 'sendCustomDataEvent',
      getUserId: 'getAnalyticsUserId',
    },
    MediaControlsApi: {
      isEnabled: 'isMediaControlsEnabled',
      setEnabled: 'setMediaControlsEnabled',
    },
    PlaylistApi: {
      getSources: 'getPlaylistSources',
      add: 'playlistAdd',
      remove: 'playlistRemove',
      removeAt: 'playlistRemoveAt',
      seek: 'playlistSeek',
      seekTo: 'playlistSeekTo',
    },
  };
  for (const [name, methods] of Object.entries(groups)) {
    const Helper = nativeClass((owner) => owner, {});
    for (const [method, target] of Object.entries(methods)) {
      Helper.prototype[method] = async function (...args) {
        const owner = peers.get(this).args[0];
        assert.ok(
          peers.has(owner),
          'Native helper constructor requires a raw Player peer'
        );
        if (['add', 'remove', 'seek', 'seekTo'].includes(method))
          assert.ok(peers.has(args[0]), `${method} requires a raw Source peer`);
        if (method === 'getSources')
          for (const source of args[0] ?? [])
            assert.ok(
              peers.has(source),
              'getSources requires raw known Source peers'
            );
        const control = await controlFor(owner);
        for (const arg of args) if (peers.has(arg)) await controlFor(arg);
        const value = await control[target](...args);
        return method === 'getSources'
          ? value.map((source) =>
              peers.has(source)
                ? source
                : modules.SourceModule.Source.fromControl(source)
            )
          : value;
      };
    }
    modules.PlayerModule[name] = Helper;
  }
  modules.OfflineModule ??= {};
  modules.OfflineModule.OfflineEvents = class {
    constructor() {
      return modules.OfflineModule.createEvents();
    }
  };
  modules.OfflineModule.OfflineContentManager = nativeClass(
    (...args) => modules.OfflineModule.create(...args),
    {
      state: 'getState',
      ...Object.fromEntries(
        [
          'getOptions',
          'download',
          'resume',
          'suspend',
          'cancelDownload',
          'usedStorage',
          'deleteAll',
          'downloadLicense',
          'releaseLicense',
          'renewOfflineLicense',
          'destroy',
        ].map((key) => [key, key])
      ),
    }
  );
  Object.defineProperty(
    modules.OfflineModule.OfflineContentManager.prototype,
    'events',
    {
      get() {
        return peers.get(this).args[1];
      },
    }
  );
  modules.FullscreenHandlerModule ??= {};
  modules.FullscreenHandlerModule.FullscreenHandler = nativeClass(
    (...args) => modules.FullscreenHandlerModule.create(...args),
    { setIsFullscreenActive: 'setIsFullscreenActive', destroy: 'destroy' },
    { synchronous: true }
  );
  modules.CustomMessageHandlerModule ??= {};
  modules.CustomMessageHandlerModule.CustomMessageHandler = nativeClass(
    (...args) => modules.CustomMessageHandlerModule.create(...args),
    { sendMessage: 'sendMessage', destroy: 'destroy' },
    { synchronous: true }
  );
  return {
    controlFor,
    sourcePeer: (control) => modules.SourceModule.Source.fromControl(control),
  };
}
module.exports = { installNativeClasses, controlFor };
