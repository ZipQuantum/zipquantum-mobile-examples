package com.zipquantum.tauri.deferredlink

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.android.installreferrer.api.InstallReferrerClient.InstallReferrerResponse
import java.util.concurrent.atomic.AtomicBoolean

@TauriPlugin
class ZqDeferredPlugin(private val activity: Activity) : Plugin(activity) {
    private val requested = AtomicBoolean(false)

    @Command
    fun getPendingRoute(invoke: Invoke) {
        if (!requested.compareAndSet(false, true)) {
            invoke.resolve(emptyResponse())
            return
        }

        val client = InstallReferrerClient.newBuilder(activity).build()
        val completed = AtomicBoolean(false)

        fun finish(response: JSObject) {
            if (!completed.compareAndSet(false, true)) return
            runCatching { client.endConnection() }
            invoke.resolve(response)
        }

        fun failClosed() = finish(emptyResponse())

        client.startConnection(object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
                if (responseCode != InstallReferrerResponse.OK) {
                    failClosed()
                    return
                }

                val handoff = runCatching {
                    HandoffParser.parse(client.installReferrer.installReferrer)
                }.getOrNull()

                if (handoff == null) {
                    failClosed()
                    return
                }

                val value = JSObject().apply {
                    put("token", handoff.token)
                    put("host", handoff.host)
                }
                finish(JSObject().apply { put("handoff", value) })
            }

            override fun onInstallReferrerServiceDisconnected() {
                failClosed()
            }
        })
    }

    private fun emptyResponse(): JSObject = JSObject().apply { put("handoff", null) }
}
