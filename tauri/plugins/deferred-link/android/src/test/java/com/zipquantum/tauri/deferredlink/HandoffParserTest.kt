package com.zipquantum.tauri.deferredlink

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HandoffParserTest {
    @Test
    fun parsesExpectedKeys() {
        assertEquals(
            DeferredHandoff("opaque_token", "links.example.com"),
            HandoffParser.parse("utm_source=example&zq_token=opaque_token&zq_host=links.example.com")
        )
    }

    @Test
    fun rejectsMissingDuplicateOrMalformedValues() {
        assertNull(HandoffParser.parse("zq_host=links.example.com"))
        assertNull(HandoffParser.parse("zq_token=one&zq_token=two&zq_host=links.example.com"))
        assertNull(HandoffParser.parse("zq_token=opaque_token&zq_host=not_a_host"))
        assertNull(HandoffParser.parse("zq_token=has%20spaces&zq_host=links.example.com"))
    }
}
