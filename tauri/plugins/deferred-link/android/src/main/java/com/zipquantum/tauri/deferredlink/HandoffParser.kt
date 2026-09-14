package com.zipquantum.tauri.deferredlink

import java.net.URLDecoder
import java.nio.charset.StandardCharsets

data class DeferredHandoff(val token: String, val host: String)

object HandoffParser {
    private val tokenPattern = Regex("^[A-Za-z0-9._~-]{1,512}$")
    private val hostPattern = Regex("^(?=.{1,253}$)([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$")

    fun parse(referrer: String): DeferredHandoff? {
        val fields = mutableMapOf<String, String>()
        for (part in referrer.split('&')) {
            if (part.isBlank()) continue
            val separator = part.indexOf('=')
            if (separator <= 0) continue
            val key = decode(part.substring(0, separator))
            if (key != "zq_token" && key != "zq_host") continue
            if (fields.containsKey(key)) return null
            fields[key] = decode(part.substring(separator + 1)).trim()
        }

        val token = fields["zq_token"] ?: return null
        val host = fields["zq_host"]?.lowercase() ?: return null
        if (!tokenPattern.matches(token) || !hostPattern.matches(host)) return null
        return DeferredHandoff(token, host)
    }

    private fun decode(value: String): String =
        URLDecoder.decode(value, StandardCharsets.UTF_8.name())
}
