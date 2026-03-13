package com.novoriq.flow.android.feature.invoices

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.DemoFlowRepository
import com.novoriq.flow.android.core.designsystem.FlowEmptyState
import com.novoriq.flow.android.core.designsystem.FlowChipRow
import com.novoriq.flow.android.core.designsystem.FlowFilterChip
import com.novoriq.flow.android.core.designsystem.FlowListRow
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowStatusChip
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.model.Customer
import com.novoriq.flow.android.core.model.Invoice
import com.novoriq.flow.android.core.model.RecordStatus
import com.novoriq.flow.android.core.ui.FlowDetailPage
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.asFlowDate
import com.novoriq.flow.android.feature.shared.color
import com.novoriq.flow.android.feature.shared.label
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

class InvoicesViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    private val queryState = MutableStateFlow("")
    private val statusFilterState = MutableStateFlow<RecordStatus?>(null)

    val query: StateFlow<String> = queryState.asStateFlow()
    val statusFilter: StateFlow<RecordStatus?> = statusFilterState.asStateFlow()
    val customers = repository.customers
    val invoices = combine(repository.invoices, queryState, statusFilterState) { invoices, query, filter ->
        invoices.filter { invoice ->
            val matchesQuery = query.isBlank() || invoice.number.contains(query, true) || invoice.customerName.contains(query, true)
            val matchesFilter = filter == null || invoice.status == filter
            matchesQuery && matchesFilter
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    fun updateQuery(value: String) {
        queryState.value = value
    }

    fun setFilter(filter: RecordStatus?) {
        statusFilterState.value = filter
    }

    fun saveInvoice(
        customerId: String,
        title: String,
        amount: Double,
        dueDate: LocalDate,
        notes: String,
        existingId: String? = null
    ) {
        viewModelScope.launch {
            repository.createInvoice(customerId, title, amount, dueDate, notes, existingId)
        }
    }
}

@Composable
fun InvoicesRoute(
    repository: DemoFlowRepository,
    onOpenInvoice: (String) -> Unit,
    onCreateInvoice: () -> Unit
) {
    val viewModel: InvoicesViewModel = viewModel(
        factory = flowViewModelFactory { InvoicesViewModel(repository) }
    )
    val invoices by viewModel.invoices.collectAsStateWithLifecycle()
    val query by viewModel.query.collectAsStateWithLifecycle()
    val filter by viewModel.statusFilter.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Invoices", "Create, review, and follow up on receivables from a native Flow client.")
        FlowTextField(query, viewModel::updateQuery, "Search invoices")
        FlowChipRow {
            listOf(null, RecordStatus.Sent, RecordStatus.PartiallyPaid, RecordStatus.Overdue, RecordStatus.Paid).forEach { status ->
                FlowFilterChip(
                    label = status?.label() ?: "All",
                    selected = filter == status,
                    onClick = { viewModel.setFilter(status) }
                )
            }
        }
        if (invoices.isEmpty()) {
            FlowEmptyState("No invoices in view", "Use the create action to issue a customer invoice.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(invoices, key = { it.id }) { invoice ->
                    FlowListRow(
                        title = "${invoice.number} • ${invoice.customerName}",
                        subtitle = "Outstanding ${invoice.outstandingAmount.asCurrency()} • Due ${invoice.dueDate.asFlowDate()}",
                        trailing = { FlowStatusChip(invoice.status.label(), invoice.status.color()) },
                        onClick = { onOpenInvoice(invoice.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun InvoiceFab(onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick) {
        Icon(Icons.Outlined.Add, contentDescription = "Add invoice")
    }
}

@Composable
fun InvoiceDetailRoute(
    repository: DemoFlowRepository,
    invoiceId: String,
    onRecordPayment: (String) -> Unit
) {
    val invoices by repository.invoices.collectAsStateWithLifecycle()
    val invoice = invoices.firstOrNull { it.id == invoiceId }
    if (invoice == null) {
        FlowEmptyState("Invoice missing", "The invoice record could not be found.")
        return
    }

    FlowDetailPage {
        FlowSectionHeader(invoice.number, "${invoice.customerName} • Due ${invoice.dueDate.asFlowDate()}")
        FlowSurfaceCard {
            Text("Total", style = MaterialTheme.typography.labelMedium)
            Text(invoice.totalAmount.asCurrency(), style = MaterialTheme.typography.headlineMedium)
            Text("Paid ${invoice.paidAmount.asCurrency()} • Outstanding ${invoice.outstandingAmount.asCurrency()}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            FlowStatusChip(invoice.status.label(), invoice.status.color())
        }
        FlowSurfaceCard {
            Text("Line items", style = MaterialTheme.typography.titleMedium)
            invoice.lines.forEach { line ->
                Text("${line.description} • ${line.total.asCurrency()}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(invoice.notes, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (invoice.outstandingAmount > 0.0) {
                FlowPrimaryButton(
                    label = "Record payment",
                    onClick = { onRecordPayment(invoice.id) },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun InvoiceEditorRoute(
    repository: DemoFlowRepository,
    invoiceId: String?,
    onSaved: () -> Unit
) {
    val viewModel: InvoicesViewModel = viewModel(
        factory = flowViewModelFactory { InvoicesViewModel(repository) }
    )
    val invoices by repository.invoices.collectAsStateWithLifecycle()
    val customers by repository.customers.collectAsStateWithLifecycle()
    val existing = invoices.firstOrNull { it.id == invoiceId }

    var title by remember(existing?.id) { mutableStateOf(existing?.lines?.firstOrNull()?.description ?: "") }
    var amount by remember(existing?.id) { mutableStateOf(existing?.totalAmount?.toString() ?: "") }
    var notes by remember(existing?.id) { mutableStateOf(existing?.notes ?: "") }
    var selectedCustomerId by remember(existing?.id, customers) { mutableStateOf(existing?.customerId ?: customers.firstOrNull()?.id.orEmpty()) }
    var dueDateText by remember(existing?.id) { mutableStateOf((existing?.dueDate ?: LocalDate.now().plusDays(14)).toString()) }

    FlowDetailPage {
        FlowSectionHeader(
            title = if (existing == null) "Create invoice" else "Edit invoice",
            subtitle = "Keep invoice status and customer context aligned with Flow's receivables logic."
        )
        FlowSurfaceCard {
            Text("Customer", style = MaterialTheme.typography.labelMedium)
            FlowChipRow {
                customers.forEach { customer ->
                    FlowFilterChip(
                        label = customer.name,
                        selected = selectedCustomerId == customer.id,
                        onClick = { selectedCustomerId = customer.id }
                    )
                }
            }
            FlowTextField(title, { title = it }, "Invoice description")
            FlowTextField(amount, { amount = it }, "Amount")
            FlowTextField(dueDateText, { dueDateText = it }, "Due date (YYYY-MM-DD)")
            FlowTextField(notes, { notes = it }, "Notes", singleLine = false)
            FlowPrimaryButton(
                label = if (existing == null) "Save invoice" else "Update invoice",
                onClick = {
                    val parsedAmount = amount.toDoubleOrNull() ?: 0.0
                    val parsedDueDate = runCatching { LocalDate.parse(dueDateText) }.getOrElse { LocalDate.now().plusDays(14) }
                    viewModel.saveInvoice(selectedCustomerId, title, parsedAmount, parsedDueDate, notes, existing?.id)
                    onSaved()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
