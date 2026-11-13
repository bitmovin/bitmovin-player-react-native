import BitmovinPlayer
import ExpoModulesCore

public class BufferModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BufferModule")

        OnCreate {
            // Module initialization
        }

        AsyncFunction("getLevel") { (owner: SharedPlayer, type: String) -> [String: Any]? in
            let player = try owner.player

            guard let bufferType = RCTConvert.bufferType(type) else {
                return nil
            }

            let level = player.buffer.getLevel(bufferType)
            let bufferLevels = RNBufferLevels(audio: level, video: level)
            return RCTConvert.toJson(bufferLevels: bufferLevels)
        }.runOnQueue(.main)

        AsyncFunction("setTargetLevel") { (owner: SharedPlayer, type: String, value: Double) in
            let player = try owner.player

            let bufferType = RCTConvert.bufferType(type)

            guard bufferType == .forwardDuration else {
                return
            }

            player.buffer.setTargetLevel(value)
        }.runOnQueue(.main)
    }
}
