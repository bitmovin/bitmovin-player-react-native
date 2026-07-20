package com.bitmovin.player.reactnative.googledai

import android.view.ViewGroup
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.advertising.AdvertisingApi
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.integration.googledai.api.GoogleDai
import com.bitmovin.player.integration.googledai.api.GoogleDaiSourceConfig
import com.bitmovin.player.integration.googledai.api.GoogleDaiSourceType
import com.bitmovin.player.integration.googledai.api.googleDai
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.PlayerAccessor
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap

private const val GOOGLE_DAI_ARTIFACT = "com.bitmovin.player.integration:google-dai:0.1.0-alpha.1"

class GoogleDaiModule : Module() {
    private val googleDaiAdapters = ConcurrentHashMap<NativeId, GoogleDai>()
    private val googleDaiPlayers = ConcurrentHashMap<NativeId, NativeId>()
    private val playerOwners = ConcurrentHashMap<NativeId, NativeId>()
    private val destroyListeners = ConcurrentHashMap<NativeId, DestroyListener>()

    override fun definition() = ModuleDefinition {
        Name("GoogleDaiModule")

        OnDestroy {
            googleDaiAdapters.keys.toList().forEach(::destroyAdapter)
        }

        AsyncFunction("initialize") { googleDaiId: NativeId, playerId: NativeId ->
            initialize(googleDaiId, playerId)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("load") { googleDaiId: NativeId, sourceConfig: Map<String, Any?> ->
            val validatedGoogleDaiId = googleDaiId.nonEmptyNativeId("googleDaiId")
            val googleDai = googleDaiAdapters[validatedGoogleDaiId]
                ?: throw GoogleDaiException.UnknownAdapter(validatedGoogleDaiId)
            val nativeSourceConfig = sourceConfig.toGoogleDaiSourceConfig()
            try {
                ensureNativeCompatibility()
                googleDai.load(nativeSourceConfig)
            } catch (error: GoogleDaiException) {
                throw error
            } catch (error: LinkageError) {
                throw GoogleDaiException.NativeCompatibilityFailed(error.message ?: "Unknown error")
            } catch (error: Exception) {
                throw GoogleDaiException.NativeLoadFailed(error.message ?: "Unknown error")
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("destroy") { googleDaiId: NativeId ->
            destroyAdapter(googleDaiId.nonEmptyNativeId("googleDaiId"))
        }.runOnQueue(Queues.MAIN)
    }

    private fun initialize(googleDaiId: NativeId, playerId: NativeId) {
        val validatedGoogleDaiId = googleDaiId.nonEmptyNativeId("googleDaiId")
        val validatedPlayerId = playerId.nonEmptyNativeId("playerId")

        googleDaiAdapters[validatedGoogleDaiId]?.let {
            if (googleDaiPlayers[validatedGoogleDaiId] == validatedPlayerId) {
                return
            }
            throw GoogleDaiException.DuplicateAdapterId(validatedGoogleDaiId)
        }

        playerOwners[validatedPlayerId]?.let { existingGoogleDaiId ->
            if (googleDaiAdapters.containsKey(existingGoogleDaiId)) {
                throw GoogleDaiException.DuplicatePlayer(validatedPlayerId)
            }
            playerOwners.remove(validatedPlayerId, existingGoogleDaiId)
        }

        val player = PlayerAccessor.get(validatedPlayerId)
            ?: throw GoogleDaiException.PlayerUnavailable(validatedPlayerId)
        try {
            ensureNativeCompatibility()
            googleDaiAdapters[validatedGoogleDaiId] = player.googleDai
            googleDaiPlayers[validatedGoogleDaiId] = validatedPlayerId
            playerOwners[validatedPlayerId] = validatedGoogleDaiId
            observePlayerDestroy(validatedGoogleDaiId, player)
        } catch (error: GoogleDaiException) {
            destroyAdapter(validatedGoogleDaiId)
            throw error
        } catch (error: LinkageError) {
            destroyAdapter(validatedGoogleDaiId)
            throw GoogleDaiException.NativeCompatibilityFailed(error.message ?: "Unknown error")
        } catch (error: Exception) {
            destroyAdapter(validatedGoogleDaiId)
            throw GoogleDaiException.NativeInitializationFailed(error.message ?: "Unknown error")
        }
    }

    private fun observePlayerDestroy(googleDaiId: NativeId, player: Player) {
        val listener: (PlayerEvent.Destroy) -> Unit = { destroyAdapter(googleDaiId) }
        player.on(PlayerEvent.Destroy::class, listener)
        destroyListeners[googleDaiId] = DestroyListener(player, listener)
    }

    private fun destroyAdapter(googleDaiId: NativeId) {
        val googleDai = googleDaiAdapters.remove(googleDaiId)
        val playerId = googleDaiPlayers.remove(googleDaiId)
        if (playerId != null) {
            playerOwners.remove(playerId, googleDaiId)
        }
        destroyListeners.remove(googleDaiId)?.remove()
        googleDai?.destroyIfAvailable()
    }
}

private fun NativeId.nonEmptyNativeId(field: String): NativeId {
    if (isBlank()) {
        throw GoogleDaiException.InvalidNativeId(field)
    }
    return this
}

private fun GoogleDai.destroyIfAvailable() {
    try {
        val destroyMethod = javaClass.methods.firstOrNull { method ->
            method.name == "destroy" && method.parameterTypes.isEmpty()
        } ?: javaClass.declaredMethods.firstOrNull { method ->
            method.name == "destroy" && method.parameterTypes.isEmpty()
        } ?: return
        destroyMethod.isAccessible = true
        destroyMethod.invoke(this)
    } catch (_: Exception) {
        // The alpha Android DAI API has no public destroy contract; keep RN destroy idempotent.
    }
}

private fun ensureNativeCompatibility() {
    val hasRequiredAdvertisingViewGroupGetter = AdvertisingApi::class.java.methods.any { method ->
        method.name == "getViewGroup" &&
            method.parameterTypes.isEmpty() &&
            method.returnType == ViewGroup::class.java
    }
    if (!hasRequiredAdvertisingViewGroupGetter) {
        throw GoogleDaiException.NativeCompatibilityFailed(
            "The pinned $GOOGLE_DAI_ARTIFACT artifact requires AdvertisingApi.getViewGroup(), " +
                "but the aligned Android Player SDK does not expose it. Use a mutually compatible " +
                "Android Player SDK and Google DAI artifact pair",
        )
    }
}

private class DestroyListener(
    private val player: Player,
    private val listener: (PlayerEvent.Destroy) -> Unit,
) {
    fun remove() {
        try {
            player.off(PlayerEvent.Destroy::class, listener)
        } catch (_: Exception) {
            // The player can already be in teardown when this listener runs.
        }
    }
}

private fun Map<String, Any?>.toGoogleDaiSourceConfig(): GoogleDaiSourceConfig {
    val kind = this["kind"] as? String ?: throw GoogleDaiException.InvalidSourceConfig(
        "kind must be 'live'",
    )
    if (kind != "live") {
        throw GoogleDaiException.InvalidSourceConfig("unsupported kind '$kind'")
    }
    return GoogleDaiSourceConfig.Live(
        assetKey = nonEmptyString("assetKey"),
        type = sourceType(),
        apiKey = optionalString("apiKey"),
        networkCode = optionalString("networkCode"),
        adTagParameters = adTagParameters(),
    )
}

private fun Map<String, Any?>.nonEmptyString(key: String): String {
    val value = this[key] as? String ?: throw GoogleDaiException.InvalidSourceConfig(
        "$key must be a non-empty string",
    )
    if (value.isBlank()) {
        throw GoogleDaiException.InvalidSourceConfig("$key must be a non-empty string")
    }
    return value
}

private fun Map<String, Any?>.optionalString(key: String): String? {
    val value = this[key] ?: return null
    return value as? String ?: throw GoogleDaiException.InvalidSourceConfig(
        "$key must be a string when provided",
    )
}

private fun Map<String, Any?>.sourceType(): GoogleDaiSourceType =
    when (this["type"] as? String) {
        "dash" -> GoogleDaiSourceType.Dash
        "hls" -> GoogleDaiSourceType.Hls
        else -> throw GoogleDaiException.InvalidSourceConfig("type must be 'dash' or 'hls'")
    }

private fun Map<String, Any?>.adTagParameters(): Map<String, String> {
    val rawValue = this["adTagParameters"] ?: return emptyMap()
    val rawMap = rawValue as? Map<*, *> ?: throw GoogleDaiException.InvalidSourceConfig(
        "adTagParameters must be an object with string keys and values",
    )
    return rawMap.entries.associate { (key, value) ->
        if (key !is String || value !is String) {
            throw GoogleDaiException.InvalidSourceConfig(
                "adTagParameters must contain only string keys and values",
            )
        }
        key to value
    }
}

sealed class GoogleDaiException(message: String) : CodedException(message) {
    class PlayerUnavailable(playerId: NativeId) : GoogleDaiException(
        "Player '$playerId' is not initialized or has already been destroyed.",
    )

    class DuplicatePlayer(playerId: NativeId) : GoogleDaiException(
        "Player '$playerId' already has an active GoogleDai instance.",
    )

    class DuplicateAdapterId(googleDaiId: NativeId) : GoogleDaiException(
        "GoogleDai '$googleDaiId' is already initialized for another player.",
    )

    class UnknownAdapter(googleDaiId: NativeId) : GoogleDaiException(
        "GoogleDai '$googleDaiId' is not initialized or has already been destroyed.",
    )

    class InvalidSourceConfig(reason: String) : GoogleDaiException(
        "Invalid Google DAI source config: $reason.",
    )

    class InvalidNativeId(field: String) : GoogleDaiException(
        "$field must be a non-empty string.",
    )

    class NativeInitializationFailed(reason: String) : GoogleDaiException(
        "Could not initialize Google DAI: $reason.",
    )

    class NativeCompatibilityFailed(reason: String) : GoogleDaiException(
        "Google DAI native dependency compatibility error: $reason.",
    )

    class NativeLoadFailed(reason: String) : GoogleDaiException(
        "Could not load Google DAI source config: $reason.",
    )
}
