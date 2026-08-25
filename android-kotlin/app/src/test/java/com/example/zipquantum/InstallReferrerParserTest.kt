package com.example.zipquantum

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class InstallReferrerParserTest {
    @Test fun parsesZipQuantumParameters() {
        val result = InstallReferrerParser.parse("utm_source=test&zq_token=opaque%2Btoken&zq_host=links.example.com")
        assertEquals("opaque+token", result?.token)
        assertEquals("links.example.com", result?.host)
    }

    @Test fun rejectsMissingToken() {
        assertNull(InstallReferrerParser.parse("zq_host=links.example.com"))
    }

    @Test fun rejectsMissingHost() {
        assertNull(InstallReferrerParser.parse("zq_token=opaque"))
    }

    @Test fun rejectsMalformedEncodingWithoutCrashing() {
        assertNull(InstallReferrerParser.parse("zq_token=%GG&zq_host=links.example.com"))
    }
}
