import AVFAudio
import ExpoModulesCore

public class AudioSessionModule: Module {
    public func definition() -> ModuleDefinition {
        Name("AudioSessionModule")

        AsyncFunction("setCategory") { (category: String) in
            if let parsedCategory = parseCategory(category) {
                do {
                    try AVAudioSession.sharedInstance().setCategory(parsedCategory)
                } catch {
                    throw Exception(name: "AUDIO_SESSION_ERROR", description: error.localizedDescription)
                }
            } else {
                throw Exception(name: "INVALID_CATEGORY", description: "Unknown audio session category: \(category)")
            }
        }.runOnQueue(.main)
    }

    private func parseCategory(_ category: String) -> AVAudioSession.Category? {
        switch category {
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
