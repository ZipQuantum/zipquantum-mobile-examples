package com.example.zipquantum

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class LinkUiState(val status: String = "Waiting for a verified link", val destination: String? = null, val working: Boolean = false)

class LinkViewModel(application: Application) : AndroidViewModel(application) {
    private val client = ZipQuantumClient(application)
    private val referrer = InstallReferrerRepository(application)
    private val mutableState = MutableStateFlow(LinkUiState())
    val state: StateFlow<LinkUiState> = mutableState

    fun openAppLink(uri: Uri) = deliver { client.resolve(uri) }

    fun recoverAfterInstall() = viewModelScope.launch {
        val handoff = referrer.deferredHandoff() ?: return@launch
        deliver { client.recover(handoff) }
    }

    private fun deliver(operation: suspend () -> Delivery) = viewModelScope.launch {
        mutableState.value = mutableState.value.copy(working = true)
        runCatching { operation() }.onSuccess { delivery ->
            val destination = delivery.link.destinationUrl ?: delivery.link.url
            mutableState.value = LinkUiState("Route opened: ${delivery.delivery}", destination, false)

            // Move this acknowledgement after your real navigation succeeds.
            val host = delivery.link.host ?: Uri.parse(delivery.link.url).host
            if (delivery.routeAck != null && host != null) client.acknowledgeRouteOpened(delivery.routeAck, host)
        }.onFailure { mutableState.value = LinkUiState(it.message ?: "Delivery failed") }
    }
}
