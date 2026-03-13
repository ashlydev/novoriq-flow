package com.novoriq.flow.android.feature.payments

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
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.model.Payment
import com.novoriq.flow.android.core.model.PaymentMethod
import com.novoriq.flow.android.core.ui.FlowDetailPage
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.asFlowDate
import kotlinx.coroutines.launch

class PaymentsViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    val payments = repository.payments
    val invoices = repository.invoices

    fun recordPayment(
        invoiceId: String,
        amount: Double,
        method: PaymentMethod,
        reference: String,
        notes: String
    ) {
        viewModelScope.launch {
            repository.createPayment(invoiceId, amount, method, reference, notes)
        }
    }
}

@Composable
fun PaymentsRoute(
    repository: DemoFlowRepository,
    onOpenPayment: (String) -> Unit,
    onCreatePayment: () -> Unit
) {
    val viewModel: PaymentsViewModel = viewModel(
        factory = flowViewModelFactory { PaymentsViewModel(repository) }
    )
    val payments by viewModel.payments.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Payments", "Capture settlements against invoices and keep receivables current.")
        if (payments.isEmpty()) {
            FlowEmptyState("No payments yet", "Record a payment from an invoice or use the payment action.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(payments, key = { it.id }) { payment ->
                    FlowListRow(
                        title = "${payment.customerName} • ${payment.amount.asCurrency()}",
                        subtitle = "${payment.invoiceNumber} • ${payment.method.name} • ${payment.date.asFlowDate()}",
                        onClick = { onOpenPayment(payment.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun PaymentFab(onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick) {
        Icon(Icons.Outlined.Add, contentDescription = "Record payment")
    }
}

@Composable
fun PaymentDetailRoute(repository: DemoFlowRepository, paymentId: String) {
    val payments by repository.payments.collectAsStateWithLifecycle()
    val payment = payments.firstOrNull { it.id == paymentId }
    if (payment == null) {
        FlowEmptyState("Payment missing", "This payment could not be found.")
        return
    }
    FlowDetailPage {
        FlowSectionHeader("Payment detail", payment.customerName)
        FlowSurfaceCard {
            Text(payment.amount.asCurrency(), style = MaterialTheme.typography.headlineMedium)
            Text(payment.invoiceNumber, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Method: ${payment.method.name}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("Reference: ${payment.reference}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(payment.notes, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun PaymentEditorRoute(
    repository: DemoFlowRepository,
    preselectedInvoiceId: String?,
    onSaved: () -> Unit
) {
    val viewModel: PaymentsViewModel = viewModel(
        factory = flowViewModelFactory { PaymentsViewModel(repository) }
    )
    val invoices by viewModel.invoices.collectAsStateWithLifecycle()

    var selectedInvoiceId by remember(invoices, preselectedInvoiceId) {
        mutableStateOf(preselectedInvoiceId ?: invoices.firstOrNull()?.id.orEmpty())
    }
    var amount by remember { mutableStateOf("") }
    var method by remember { mutableStateOf(PaymentMethod.BankTransfer) }
    var reference by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    FlowDetailPage {
        FlowSectionHeader("Record payment", "Tie every payment back to the correct invoice and customer.")
        FlowSurfaceCard {
            Text("Invoice", style = MaterialTheme.typography.labelMedium)
            FlowChipRow {
                invoices.forEach { invoice ->
                    FlowFilterChip(
                        label = invoice.number,
                        selected = selectedInvoiceId == invoice.id,
                        onClick = { selectedInvoiceId = invoice.id }
                    )
                }
            }
            Text("Method", style = MaterialTheme.typography.labelMedium)
            FlowChipRow {
                PaymentMethod.entries.forEach { entry ->
                    FlowFilterChip(
                        label = entry.name,
                        selected = method == entry,
                        onClick = { method = entry }
                    )
                }
            }
            FlowTextField(amount, { amount = it }, "Amount")
            FlowTextField(reference, { reference = it }, "Reference")
            FlowTextField(notes, { notes = it }, "Notes", singleLine = false)
            FlowPrimaryButton(
                label = "Save payment",
                onClick = {
                    viewModel.recordPayment(
                        invoiceId = selectedInvoiceId,
                        amount = amount.toDoubleOrNull() ?: 0.0,
                        method = method,
                        reference = reference,
                        notes = notes
                    )
                    onSaved()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
