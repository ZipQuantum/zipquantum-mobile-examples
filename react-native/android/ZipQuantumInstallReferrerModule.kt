package com.example.zipquantum

import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerStateListener
import com.android.installreferrer.api.InstallReferrerClient.InstallReferrerResponse
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ZipQuantumInstallReferrerModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "ZipQuantumInstallReferrer"

    @ReactMethod
    fun getRawInstallReferrer(promise: Promise) {
        val client = InstallReferrerClient.newBuilder(reactApplicationContext).build()
        client.startConnection(object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
                try {
                    if (responseCode != InstallReferrerResponse.OK) {
                        promise.reject("ZQ_REFERRER_$responseCode", "Install Referrer unavailable")
                        return
                    }
                    promise.resolve(client.installReferrer.installReferrer)
                } catch (error: Exception) {
                    promise.reject("ZQ_REFERRER_ERROR", error)
                } finally {
                    client.endConnection()
                }
            }
            override fun onInstallReferrerServiceDisconnected() = Unit
        })
    }
}
