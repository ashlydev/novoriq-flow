package com.novoriq.flow.android.feature.reports

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.feature.shared.asCurrency

class ReportsViewModel(repository: FlowRepository) : ViewModel() {
    val dashboard = repository.dashboard
}

@Composable
fun ReportsRoute(repository: FlowRepository) {
    val viewModel: ReportsViewModel = viewModel(
        factory = flowViewModelFactory { ReportsViewModel(repository) }
    )
    val dashboard by viewModel.dashboard.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Reports snapshot", "Android V1 keeps reporting focused on the most useful daily summary signals.")
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FlowMetricCard("Collections", dashboard.collectionsThisMonth.asCurrency(), "Payments captured", Modifier.weight(1f))
            FlowMetricCard("Outstanding", dashboard.outstandingReceivables.asCurrency(), "Receivables still open", Modifier.weight(1f))
        }
        FlowSurfaceCard {
            androidx.compose.material3.Text(dashboard.reportSummary)
        }
    }
}
