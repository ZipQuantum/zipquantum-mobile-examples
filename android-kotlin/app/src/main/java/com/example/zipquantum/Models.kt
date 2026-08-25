package com.example.zipquantum

data class RouteAcknowledgement(val receipt: String, val endpoint: String, val expiresIn: Int)
data class ResolvedLink(val url: String, val host: String?, val destinationUrl: String?)
data class Delivery(val delivery: String, val link: ResolvedLink, val routeAck: RouteAcknowledgement?)
data class DeferredHandoff(val token: String, val host: String)

object InstallReferrerParser {
    fun parse(value: String): DeferredHandoff? {
        val values = runCatching {
            value.split("&").mapNotNull { pair ->
                val parts = pair.split("=", limit = 2)
                if (parts.size != 2) null else
                    java.net.URLDecoder.decode(parts[0], Charsets.UTF_8.name()) to
                        java.net.URLDecoder.decode(parts[1], Charsets.UTF_8.name())
            }.toMap()
        }.getOrNull() ?: return null
        val token = values["zq_token"]?.takeIf { it.isNotBlank() } ?: return null
        val host = values["zq_host"]?.takeIf { it.isNotBlank() } ?: return null
        return DeferredHandoff(token, host)
    }
}
