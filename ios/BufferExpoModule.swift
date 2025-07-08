import BitmovinPlayer
import ExpoModulesCore

public class BufferExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BufferExpoModule")

        OnCreate {
            // Module initialization
        }

        // PHASE 1: Start with simple utility methods

        /**
         Get buffer level for the specified player and buffer type.
         */
        AsyncFunction("getLevel") { (playerId: String, type: String) -> Double? in
            await withCheckedContinuation { (continuation: CheckedContinuation<Double?, Never>) in
                DispatchQueue.main.async {
                    defer { continuation.resume(returning: nil) }
                    
                    // Access PlayerExpoModule to retrieve player
                    guard let player = PlayerExpoModule.retrieve(playerId) else {
                        return
                    }
                    
                    let bufferLevel: Double
                    switch type.lowercased() {
                    case "audio":
                        bufferLevel = player.buffer.getLevel(for: .audio)
                    case "video":
                        bufferLevel = player.buffer.getLevel(for: .video)
                    default:
                        return // Unknown buffer type
                    }
                    
                    continuation.resume(returning: bufferLevel)
                }
            }
        }

        /**
         Set target level for the specified player and buffer type.
         */
        AsyncFunction("setTargetLevel") { (playerId: String, type: String, value: Double) -> Void in
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async {
                    defer { continuation.resume() }
                    
                    // Access PlayerExpoModule to retrieve player
                    guard let player = PlayerExpoModule.retrieve(playerId) else {
                        return
                    }
                    
                    let targetLevel = TimeInterval(value)
                    switch type.lowercased() {
                    case "audio":
                        player.buffer.setTargetLevel(targetLevel, for: .audio)
                    case "video":
                        player.buffer.setTargetLevel(targetLevel, for: .video)
                    default:
                        break // Unknown buffer type
                    }
                }
            }
        }
    }
}
