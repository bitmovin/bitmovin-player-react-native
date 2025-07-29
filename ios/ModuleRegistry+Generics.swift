import ExpoModulesCore

extension ModuleRegistry {
    func get<T: Module>(_ type: T.Type = T.self) -> T? {
        guard let name = String(describing: type)
            .split(separator: ".", maxSplits: 1, omittingEmptySubsequences: true).last else {
            return nil
        }
        return self.get(moduleWithName: String(name)) as? T
    }
}
