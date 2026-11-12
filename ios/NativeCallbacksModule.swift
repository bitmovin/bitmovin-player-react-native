import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public class NativeCallbacksModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NativeCallbacksModule")
        Class("SharedCallbackResult", SharedCallbackResult.self) {
            Function("resolve") { (result: SharedCallbackResult, value: JavaScriptValue) in
                result.resolve(value.getAny())
            }
        }
    }
}
