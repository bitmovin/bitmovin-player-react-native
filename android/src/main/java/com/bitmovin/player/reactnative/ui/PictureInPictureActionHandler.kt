package com.bitmovin.player.reactnative.ui

import android.app.RemoteAction
import com.bitmovin.player.reactnative.PictureInPictureAction

internal interface PictureInPictureActionHandler {
    fun updatePictureInPictureActions(actions: List<PictureInPictureAction>)
    fun buildRemoteActions(): List<RemoteAction>
    fun dispose()
}
