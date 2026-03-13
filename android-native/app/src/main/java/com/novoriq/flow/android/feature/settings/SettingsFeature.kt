package com.novoriq.flow.android.feature.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.SessionRepository
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSecondaryButton
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.model.SessionSnapshot
import kotlinx.coroutines.launch

class SettingsViewModel(private val sessionRepository: SessionRepository) : ViewModel() {
    val session = sessionRepository.session

    fun signOut() {
        viewModelScope.launch { sessionRepository.signOut() }
    }
}

@Composable
fun MoreRoute(
    onSuppliers: () -> Unit,
    onPayments: () -> Unit,
    onNotifications: () -> Unit,
    onReports: () -> Unit,
    onSettings: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("More", "Secondary Android V1 areas and future-ready entry points.")
        FlowSurfaceCard {
            FlowPrimaryButton("Suppliers", onSuppliers, Modifier.fillMaxWidth())
            FlowSecondaryButton("Payments", onPayments, Modifier.fillMaxWidth())
            FlowSecondaryButton("Notifications", onNotifications, Modifier.fillMaxWidth())
            FlowSecondaryButton("Reports snapshot", onReports, Modifier.fillMaxWidth())
            FlowSecondaryButton("Settings", onSettings, Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun SettingsRoute(sessionRepository: SessionRepository) {
    val viewModel: SettingsViewModel = viewModel(
        factory = flowViewModelFactory { SettingsViewModel(sessionRepository) }
    )
    val session by viewModel.session.collectAsStateWithLifecycle()
    SettingsScreen(session, onSignOut = viewModel::signOut)
}

@Composable
fun SettingsScreen(
    session: SessionSnapshot,
    onSignOut: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Settings", "Profile, business context, support, and session controls.")
        FlowSurfaceCard {
            androidx.compose.material3.Text(session.user?.fullName ?: "Flow User")
            androidx.compose.material3.Text(session.user?.email ?: "", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
            androidx.compose.material3.Text(session.business?.name ?: "Business profile not set", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
        }
        FlowSurfaceCard {
            androidx.compose.material3.Text("Theme: Midnight Ledger — Flow Edition")
            androidx.compose.material3.Text("Support: support@novoriq.demo", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
            androidx.compose.material3.Text("About: Native Android V1 client for the broader Novoriq Flow ecosystem.", color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant)
        }
        FlowPrimaryButton("Sign out", onSignOut, Modifier.fillMaxWidth())
    }
}
