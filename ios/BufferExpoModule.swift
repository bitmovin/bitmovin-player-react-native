import BitmovinPlayer
import ExpoModulesCore

public class BufferExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BufferExpoModule")

        OnCreate {
            // Module initialization
        }

        /**
         Get buffer level for the specified player and buffer type.
         */
        AsyncFunction("getLevel") { (playerId: String, type: String) -> [String: Any]? in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerExpoModule.self),
                  let player = playerModule.retrieve(playerId) else {
                return nil
            }

            guard let bufferType = RCTConvert.bufferType(type) else {
                return nil
            }

            let level = player.buffer.getLevel(bufferType)
            let bufferLevels = RNBufferLevels(audio: level, video: level)
            return RCTConvert.toJson(bufferLevels: bufferLevels)
        }.runOnQueue(.main)

        /**
         Set target level for the specified player and buffer type.
         */
        AsyncFunction("setTargetLevel") { (playerId: String, type: String, value: Double) in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerExpoModule.self),
                  let player = playerModule.retrieve(playerId) else {
                return
            }

            let bufferType = RCTConvert.bufferType(type)

            guard bufferType == .forwardDuration else {
                return
            }

            player.buffer.setTargetLevel(value)
        }.runOnQueue(.main)
    }
}
