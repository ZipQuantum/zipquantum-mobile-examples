package com.example.zipquantum

import android.content.Context
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class InstallReferrerRepository(private val context: Context) {
    suspend fun deferredHandoff(): DeferredHandoff? {
        val preferences = context.getSharedPreferences("zipquantum_install", Context.MODE_PRIVATE)
        preferences.getString("referrer", null)?.let { return InstallReferrerParser.parse(it) }
        val raw = readFromPlay() ?: return null
        preferences.edit().putString("referrer", raw).apply()
        return InstallReferrerParser.parse(raw)
    }

    private suspend fun readFromPlay(): String? = suspendCancellableCoroutine { continuation ->
        val client = InstallReferrerClient.newBuilder(context).build()
        continuation.invokeOnCancellation { client.endConnection() }
        client.startConnection(object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
                val value = if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                    runCatching { client.installReferrer.installReferrer }.getOrNull()
                } else null
                client.endConnection()
                if (continuation.isActive) continuation.resume(value)
            }
            override fun onInstallReferrerServiceDisconnected() {
                if (continuation.isActive) continuation.resume(null)
            }
        })
    }
}
