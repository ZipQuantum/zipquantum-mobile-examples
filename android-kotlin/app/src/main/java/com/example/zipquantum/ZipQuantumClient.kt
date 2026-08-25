package com.example.zipquantum

import android.content.Context
import android.net.Uri
import android.os.Build
import android.util.DisplayMetrics
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.TimeZone

class ZipQuantumClient(private val context: Context) {
    suspend fun resolve(uri: Uri): Delivery {
        require(uri.scheme == "https" && uri.host in ZQConfiguration.ALLOWED_HOSTS) { "Unconfigured App Link" }
        val reference = uri.lastPathSegment?.takeIf(String::isNotBlank) ?: error("Missing reference")
        return post("/api/mobile/v1/links/resolve", baseContext().apply {
            put("host", uri.host)
            put("reference", reference)
            put("url", uri.toString())
            put("package_name", ZQConfiguration.PACKAGE_NAME)
            put("parameters", JSONObject().also { target -> uri.queryParameterNames.forEach { target.put(it, uri.getQueryParameter(it)) } })
        })
    }

    suspend fun recover(handoff: DeferredHandoff): Delivery =
        post("/api/mobile/v1/deferred/recover", baseContext().apply {
            put("token", handoff.token)
            put("host", handoff.host)
            put("package_name", ZQConfiguration.PACKAGE_NAME)
        })

    suspend fun acknowledgeRouteOpened(ack: RouteAcknowledgement, host: String) {
        val endpoint = Uri.parse(ack.endpoint)
        val url = if (endpoint.isAbsolute) endpoint else Uri.parse(ZQConfiguration.API_BASE_URL).buildUpon().encodedPath(ack.endpoint).build()
        require(url.scheme == "https" && url.host == Uri.parse(ZQConfiguration.API_BASE_URL).host) { "Untrusted acknowledgement endpoint" }
        postObject(url.toString(), JSONObject().apply {
            put("receipt", ack.receipt)
            put("host", host)
            put("platform", "Android")
            put("package_name", ZQConfiguration.PACKAGE_NAME)
        })
    }

    private fun baseContext(): JSONObject {
        val metrics: DisplayMetrics = context.resources.displayMetrics
        return JSONObject().apply {
            put("platform", "Android")
            put("os_name", "Android")
            put("os_version", Build.VERSION.RELEASE)
            put("model", Build.MODEL)
            put("language", Locale.getDefault().toLanguageTag())
            put("timezone", TimeZone.getDefault().id)
            put("screen_resolution", "${metrics.widthPixels}x${metrics.heightPixels}")
            put("hardware_concurrency", Runtime.getRuntime().availableProcessors())
            put("tracking_consent", false)
            put("consent_version", ZQConfiguration.CONSENT_VERSION)
        }
    }

    private suspend fun post(path: String, body: JSONObject): Delivery {
        val response = postObject(ZQConfiguration.API_BASE_URL + path, body)
        if (!response.optBoolean("success")) error("Unsuccessful delivery")
        val link = response.getJSONObject("link")
        val ack = response.optJSONObject("route_ack")?.let {
            RouteAcknowledgement(it.getString("receipt"), it.getString("endpoint"), it.getInt("expires_in"))
        }
        return Delivery(
            response.getString("delivery"),
            ResolvedLink(link.getString("url"), link.optString("host").ifBlank { null }, link.optString("destination_url").ifBlank { null }),
            ack
        )
    }

    private suspend fun postObject(url: String, body: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 12_000
            connection.readTimeout = 15_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.outputStream.use { it.write(body.toString().toByteArray()) }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (status !in 200..299) error("ZipQuantum HTTP $status")
            if (text.isBlank()) JSONObject() else JSONObject(text)
        } finally { connection.disconnect() }
    }
}
