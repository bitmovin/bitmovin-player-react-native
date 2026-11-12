package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NativeCallbacksModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeCallbacksModule")
        Class(SharedCallbackResult::class) {
            Constructor { SharedCallbackResult(appContext) }
            Function("resolve") { result: SharedCallbackResult, value: JavaScriptValue ->
                result.resolve(
                    runCatching { value.toCallbackValue() }
                        .onFailure { result.resolve(null) }
                        .getOrThrow(),
                )
            }
        }
    }
}
