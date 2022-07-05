import Foundation
import BitmovinPlayer

extension RCTConvert {
    /**
     Utility method to convert a JS object into `PlayerConfig`.
     - Parameter json: JS object
     - Returns: Generated `Playerconfig`
     */
    static func playerConfig(_ json: Any?) -> PlayerConfig? {
        let playerConfig = PlayerConfig()
        guard let json = json as? [String: Any?] else {
            return playerConfig
        }
        if let licenseKey = json["licenseKey"] as? String {
            playerConfig.key = licenseKey
        }
        return playerConfig
    }
    
    /**
     Utility method to convert a JS object into `SourceConfig`.
     - Parameter json: JS object
     - Returns: Generated `SourceConfig`
     */
    static func sourceConfig(_ json: Any?) -> SourceConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let sourceConfig = SourceConfig(
            url: RCTConvert.nsurl(json["url"]),
            type: RCTConvert.sourceType(json["type"])
        )
        if let title = json["title"] as? String {
            sourceConfig.title = title
        }
        if let poster = json["poster"] as? String {
            sourceConfig.posterSource = RCTConvert.nsurl(poster)
        }
        if let isPosterPersistent = json["isPosterPersistent"] as? Bool {
            sourceConfig.isPosterPersistent = isPosterPersistent
        }
        return sourceConfig
    }
    
    /**
     Utility method to convert a JS object into `SourceType`.
     - Parameter json: JS object
     - Returns: Generated `SourceType`
     */
    static func sourceType(_ json: Any?) -> SourceType {
        guard let json = json as? String else {
            return .none
        }
        switch json {
        case "none": return .none
        case "hls": return .hls
        case "dash": return .dash
        case "progressive": return .progressive
        default: return .none
        }
    }
    
    /**
     Utility method to convert a JS object into `TimeMode`.
     - Parameter json: JS object
     - Returns: Generated `TimeMode`
     */
    static func timeMode(_ json: Any?) -> TimeMode {
        guard let json = json as? String else {
            return .absoluteTime
        }
        switch json {
        case "absolute": return .absoluteTime
        case "relative": return .relativeTime
        default: return .absoluteTime
        }
    }
}
