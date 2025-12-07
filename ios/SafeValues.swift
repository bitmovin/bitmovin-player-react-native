import CoreMedia
import Foundation

extension CMTime {
    var safeSeconds: Double? {
        guard isNumeric else {
            return nil
        }

        let seconds = CMTimeGetSeconds(self)
        guard seconds.isFinite, !seconds.isNaN else {
            return nil
        }

        return seconds
    }
}

extension NSNumber {
    var isBoolean: Bool {
        CFGetTypeID(self) == CFBooleanGetTypeID()
    }

    var safeNumber: Double? {
        guard !isBoolean else {
            return nil
        }

        let value = doubleValue
        guard value.isFinite else {
            return nil
        }

        return value
    }
}
