import AVFoundation

@objc(AudioSessionModule)
class AudioSessionModule: NSObject, RCTBridgeModule {
    var methodQueue: DispatchQueue! {
        DispatchQueue.main
    }

    static func moduleName() -> String! {
        "AudioSessionModule"
    }

    static func requiresMainQueueSetup() -> Bool {
        true
    }

    @objc func setCategory(
        _ category: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            try AVAudioSession.sharedInstance().setCategory(parseCategory(category))
            resolve(nil)
        } catch {
            reject("\((error as NSError).code)", error.localizedDescription, error as NSError)
        }
    }

    private func parseCategory(_ category: String) -> AVAudioSession.Category {
        switch (category) {
        case "ambient":
            return .ambient
        case "multiRoute":
            return .multiRoute
        case "playAndRecord":
            return .playAndRecord
        case "playback":
            return .playback
        case "soloAmbient":
            return .soloAmbient
        default:
            return .soloAmbient
        }
    }
}
