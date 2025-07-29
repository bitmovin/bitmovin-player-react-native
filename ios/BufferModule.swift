import BitmovinPlayer
import ExpoModulesCore

public class BufferModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BufferModule")

        OnCreate {
            // Module initialization
        }

        AsyncFunction("getLevel") { (playerId: String, type: String) -> [String: Any]? in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerModule.self),
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

        AsyncFunction("setTargetLevel") { (playerId: String, type: String, value: Double) in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerModule.self),
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
