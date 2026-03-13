package com.novoriq.flow.android.feature.customers

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.novoriq.flow.android.core.designsystem.FlowListRow
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowStatusChip
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.model.Customer
import com.novoriq.flow.android.core.ui.FlowDetailPage
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.color
import com.novoriq.flow.android.feature.shared.label
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add

class CustomersViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    private val queryState = MutableStateFlow("")
    val query: StateFlow<String> = queryState.asStateFlow()
    val customers = kotlinx.coroutines.flow.combine(repository.customers, queryState) { customers, query ->
        if (query.isBlank()) customers else customers.filter {
            it.name.contains(query, true) || it.contactPerson.contains(query, true)
        }
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.Eagerly, emptyList())

    fun updateQuery(value: String) {
        queryState.value = value
    }

    fun saveCustomer(
        name: String,
        contact: String,
        phone: String,
        email: String,
        notes: String,
        existingId: String? = null
    ) {
        viewModelScope.launch {
            repository.createCustomer(name, contact, phone, email, notes, existingId)
        }
    }
}

@Composable
fun CustomersRoute(
    repository: DemoFlowRepository,
    onOpenCustomer: (String) -> Unit,
    onCreateCustomer: () -> Unit
) {
    val viewModel: CustomersViewModel = viewModel(
        factory = flowViewModelFactory { CustomersViewModel(repository) }
    )
    val customers by viewModel.customers.collectAsStateWithLifecycle()
    val query by viewModel.query.collectAsStateWithLifecycle()

    CustomersScreen(
        customers = customers,
        query = query,
        onQueryChange = viewModel::updateQuery,
        onOpenCustomer = onOpenCustomer,
        onCreateCustomer = onCreateCustomer
    )
}

@Composable
fun CustomersScreen(
    customers: List<Customer>,
    query: String,
    onQueryChange: (String) -> Unit,
    onOpenCustomer: (String) -> Unit,
    onCreateCustomer: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Customers", "Track balances, contact details, and recent account activity.")
        FlowTextField(query, onQueryChange, "Search customers")
        if (customers.isEmpty()) {
            FlowEmptyState("No customers yet", "Create your first customer to start invoicing from the Android app.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(customers, key = { it.id }) { customer ->
                    FlowListRow(
                        title = customer.name,
                        subtitle = "${customer.contactPerson} • ${customer.balance.asCurrency()}",
                        trailing = {
                            FlowStatusChip(customer.status.label(), customer.status.color())
                        },
                        onClick = { onOpenCustomer(customer.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun CustomerFab(onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick) {
        Icon(Icons.Outlined.Add, contentDescription = "Add customer")
    }
}

@Composable
fun CustomerDetailRoute(repository: DemoFlowRepository, customerId: String) {
    val customers by repository.customers.collectAsStateWithLifecycle()
    val customer = customers.firstOrNull { it.id == customerId }
    if (customer == null) {
        FlowEmptyState("Customer missing", "This customer record is no longer available.")
        return
    }

    FlowDetailPage {
        FlowSectionHeader(customer.name, "${customer.contactPerson} • ${customer.phone}")
        FlowSurfaceCard {
            Text("Email", style = MaterialTheme.typography.labelMedium)
            Text(customer.email, style = MaterialTheme.typography.bodyLarge)
            Text("Balance", style = MaterialTheme.typography.labelMedium)
            Text(customer.balance.asCurrency(), style = MaterialTheme.typography.titleLarge)
            FlowStatusChip(customer.status.label(), customer.status.color())
        }
        FlowSurfaceCard {
            Text("Notes", style = MaterialTheme.typography.titleMedium)
            Text(customer.notes, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun CustomerEditorRoute(
    repository: DemoFlowRepository,
    customerId: String?,
    onSaved: () -> Unit
) {
    val viewModel: CustomersViewModel = viewModel(
        factory = flowViewModelFactory { CustomersViewModel(repository) }
    )
    val customers by repository.customers.collectAsStateWithLifecycle()
    val existing = customers.firstOrNull { it.id == customerId }

    var name by remember(existing?.id) { mutableStateOf(existing?.name ?: "") }
    var contact by remember(existing?.id) { mutableStateOf(existing?.contactPerson ?: "") }
    var phone by remember(existing?.id) { mutableStateOf(existing?.phone ?: "") }
    var email by remember(existing?.id) { mutableStateOf(existing?.email ?: "") }
    var notes by remember(existing?.id) { mutableStateOf(existing?.notes ?: "") }

    FlowDetailPage {
        FlowSectionHeader(
            title = if (existing == null) "Create customer" else "Edit customer",
            subtitle = "Keep customer contact details and balance context aligned with the web product."
        )
        FlowSurfaceCard {
            FlowTextField(name, { name = it }, "Customer name")
            FlowTextField(contact, { contact = it }, "Contact person")
            FlowTextField(phone, { phone = it }, "Phone")
            FlowTextField(email, { email = it }, "Email")
            FlowTextField(notes, { notes = it }, "Notes", singleLine = false)
            FlowPrimaryButton(
                label = if (existing == null) "Save customer" else "Update customer",
                onClick = {
                    viewModel.saveCustomer(name, contact, phone, email, notes, existing?.id)
                    onSaved()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

