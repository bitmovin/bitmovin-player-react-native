import Foundation
import BitmovinPlayer

extension RCTConvert {
    /**
     Utility method to instantiate a `PlayerConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The produced `Playerconfig` object
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
     Utility method to instantiate a `SourceConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The produced `SourceConfig` object
     */
    static func sourceConfig(_ json: Any?, drmConfig: FairplayConfig? = nil) -> SourceConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let sourceConfig = SourceConfig(
            url: RCTConvert.nsurl(json["url"]),
            type: RCTConvert.sourceType(json["type"])
        )
        if let drmConfig = drmConfig {
            sourceConfig.drmConfig = drmConfig
        }
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
     Utility method to get a `SourceType` from a JS object.
     - Parameter json: JS object
     - Returns: The associated `SourceType` value
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
     Utility method to get a `TimeMode` from a JS object.
     - Parameter json: JS object
     - Returns: The associated `TimeMode` value
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

    /**
     Utility method to get a `FairplayConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The generated `FairplayConfig` object
     */
    static func fairplayConfig(_ json: Any?) -> FairplayConfig? {
        guard
            let json = json as? [String: Any?],
            let fairplayJson = json["fairplay"] as? [String: Any?],
            let licenseURL = fairplayJson["licenseUrl"] as? String,
            let certificateURL = fairplayJson["certificateUrl"] as? String
        else {
            return nil
        }
        let fairplayConfig = FairplayConfig(
            license: URL(string: licenseURL),
            certificateURL: URL(string: certificateURL)!
        )
        if let licenseRequestHeaders = fairplayJson["licenseRequestHeaders"] as? [String: String] {
            fairplayConfig.licenseRequestHeaders = licenseRequestHeaders
        }
        if let certificateRequestHeaders = fairplayJson["certificateRequestHeaders"] as? [String: String] {
            fairplayConfig.certificateRequestHeaders = certificateRequestHeaders
        }
        return fairplayConfig
    }
}
