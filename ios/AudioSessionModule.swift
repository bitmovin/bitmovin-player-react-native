import AVFAudio

@objc(AudioSessionModule)
class AudioSessionModule: NSObject, RCTBridgeModule {
    // Run this module methods on main thread.
    var methodQueue: DispatchQueue! {
        DispatchQueue.main
    }

    /// JS module name.
    static func moduleName() -> String! {
        "AudioSessionModule"
    }

    // Requires module initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /**
     Sets the audio session’s category.
     - Parameter category: Category string.
     - Parameter resolver: JS promise resolver block.
     - Parameter rejecter: JS promise rejecter block.
     */
    @objc func setCategory(
        _ category: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        if let category = parseCategory(category) {
            do {
                try AVAudioSession.sharedInstance().setCategory(category)
                resolve(nil)
            } catch {
                reject("\((error as NSError).code)", error.localizedDescription, error as NSError)
            }
        } else {
            let error = RCTErrorWithMessage("Unknown audio session category: \(category)") as NSError
            reject("\(error.code)", error.localizedDescription, error)
        }
    }

    /**
     Parse any category string to an `AVAudioSession.Category` type.
     */
    private func parseCategory(_ category: String) -> AVAudioSession.Category? {
        switch (category) {
        case "ambient":
            return .ambient
        case "multiRoute":
            return .multiRoute
        case "playAndRecord":
            return .playAndRecord
        case "playback":
            return .playback
        case "record":
            return .record
        case "soloAmbient":
            return .soloAmbient
        default:
            return nil
        }
    }
}
