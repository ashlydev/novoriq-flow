package com.novoriq.flow.android.feature.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.FlowRepository
import com.novoriq.flow.android.core.designsystem.FlowMetricCard
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowStatusChip
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.color

class DashboardViewModel(repository: FlowRepository) : ViewModel() {
    val dashboard = repository.dashboard
}

@Composable
fun DashboardRoute(
    repository: FlowRepository,
    onQuickAction: (String) -> Unit
) {
    val viewModel: DashboardViewModel = viewModel(
        factory = flowViewModelFactory { DashboardViewModel(repository) }
    )
    val dashboard by viewModel.dashboard.collectAsStateWithLifecycle()

    LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            FlowSectionHeader(
                title = "Daily business control",
                subtitle = dashboard.reportSummary
            )
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                FlowMetricCard(
                    title = "Collections",
                    value = dashboard.collectionsThisMonth.asCurrency(),
                    supporting = "Captured payments this month",
                    modifier = Modifier.weight(1f)
                )
                FlowMetricCard(
                    title = "Outstanding",
                    value = dashboard.outstandingReceivables.asCurrency(),
                    supporting = "${dashboard.overdueInvoices} overdue invoices",
                    modifier = Modifier.weight(1f)
                )
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                FlowMetricCard(
                    title = "Expenses",
                    value = dashboard.expensesThisMonth.asCurrency(),
                    supporting = "${dashboard.paymentsCount} payments captured",
                    modifier = Modifier.weight(1f)
                )
                FlowMetricCard(
                    title = "Customers",
                    value = dashboard.customerCount.toString(),
                    supporting = "${dashboard.supplierCount} suppliers in active view",
                    modifier = Modifier.weight(1f)
                )
            }
        }
        item {
            FlowSurfaceCard {
                FlowSectionHeader("Quick actions")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FlowStatusChip("New customer", MaterialTheme.colorScheme.primary)
                    FlowStatusChip("New invoice", MaterialTheme.colorScheme.secondary)
                    FlowStatusChip("New expense", MaterialTheme.colorScheme.tertiary)
                }
                Text(
                    "Tap into Customers, Invoices, or Expenses from the bottom navigation to create records.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        item {
            FlowSectionHeader("Attention needed", subtitle = "Priority items from receivables, suppliers, and notifications.")
        }
        items(dashboard.attentionItems, key = { it.id }) { item ->
            FlowSurfaceCard {
                Text(item.title, style = MaterialTheme.typography.titleMedium)
                Text(item.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                FlowStatusChip(item.level.name, item.level.color())
            }
        }
        item {
            FlowSectionHeader("Recent activity")
        }
        items(dashboard.recentActivity, key = { it.id }) { activity ->
            FlowSurfaceCard {
                Text(activity.title, style = MaterialTheme.typography.titleMedium)
                Text(activity.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(activity.dateLabel, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
