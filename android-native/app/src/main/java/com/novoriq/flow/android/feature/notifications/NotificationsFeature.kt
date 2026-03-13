package com.novoriq.flow.android.feature.notifications

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.DemoFlowRepository
import com.novoriq.flow.android.core.designsystem.FlowEmptyState
import com.novoriq.flow.android.core.designsystem.FlowListRow
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowStatusChip
import com.novoriq.flow.android.feature.shared.color
import kotlinx.coroutines.launch

class NotificationsViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    val notifications = repository.notifications

    fun markRead(notificationId: String) {
        viewModelScope.launch {
            repository.markNotificationRead(notificationId)
        }
    }
}

@Composable
fun NotificationsRoute(repository: DemoFlowRepository) {
    val viewModel: NotificationsViewModel = viewModel(
        factory = flowViewModelFactory { NotificationsViewModel(repository) }
    )
    val notifications by viewModel.notifications.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader(
            "Notifications",
            "${notifications.count { !it.isRead }} unread updates across receivables, payments, and expenses."
        )
        if (notifications.isEmpty()) {
            FlowEmptyState("No notifications", "Actionable updates will appear here when events happen.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(notifications, key = { it.id }) { notification ->
                    FlowListRow(
                        title = notification.title,
                        subtitle = notification.message,
                        trailing = { FlowStatusChip(if (notification.isRead) "Read" else "Unread", notification.level.color()) },
                        onClick = { viewModel.markRead(notification.id) }
                    )
                }
            }
        }
    }
}

