package com.novoriq.flow.android.feature.suppliers

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
import com.novoriq.flow.android.core.designsystem.FlowListRow
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSectionHeader
import com.novoriq.flow.android.core.designsystem.FlowStatusChip
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.model.Supplier
import com.novoriq.flow.android.core.ui.FlowDetailPage
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.color
import com.novoriq.flow.android.feature.shared.label
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SuppliersViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    private val queryState = MutableStateFlow("")
    val query: StateFlow<String> = queryState.asStateFlow()
    val suppliers = combine(repository.suppliers, queryState) { suppliers, query ->
        if (query.isBlank()) suppliers else suppliers.filter {
            it.name.contains(query, true) || it.contactPerson.contains(query, true)
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    fun updateQuery(value: String) {
        queryState.value = value
    }

    fun saveSupplier(
        name: String,
        contact: String,
        phone: String,
        email: String,
        notes: String,
        existingId: String? = null
    ) {
        viewModelScope.launch {
            repository.createSupplier(name, contact, phone, email, notes, existingId)
        }
    }
}

@Composable
fun SuppliersRoute(
    repository: DemoFlowRepository,
    onOpenSupplier: (String) -> Unit,
    onCreateSupplier: () -> Unit
) {
    val viewModel: SuppliersViewModel = viewModel(
        factory = flowViewModelFactory { SuppliersViewModel(repository) }
    )
    val suppliers by viewModel.suppliers.collectAsStateWithLifecycle()
    val query by viewModel.query.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Suppliers", "Keep core supplier records clean and practical for payable workflows.")
        FlowTextField(query, viewModel::updateQuery, "Search suppliers")
        if (suppliers.isEmpty()) {
            FlowEmptyState("No suppliers yet", "Suppliers will show here once you start recording purchasing relationships.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(suppliers, key = { it.id }) { supplier ->
                    FlowListRow(
                        title = supplier.name,
                        subtitle = "${supplier.contactPerson} • ${supplier.balance.asCurrency()}",
                        trailing = { FlowStatusChip(supplier.status.label(), supplier.status.color()) },
                        onClick = { onOpenSupplier(supplier.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun SupplierFab(onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick) {
        Icon(Icons.Outlined.Add, contentDescription = "Add supplier")
    }
}

@Composable
fun SupplierDetailRoute(repository: DemoFlowRepository, supplierId: String) {
    val suppliers by repository.suppliers.collectAsStateWithLifecycle()
    val supplier = suppliers.firstOrNull { it.id == supplierId }
    if (supplier == null) {
        FlowEmptyState("Supplier missing", "This supplier record could not be found.")
        return
    }

    FlowDetailPage {
        FlowSectionHeader(supplier.name, "${supplier.contactPerson} • ${supplier.phone}")
        FlowSurfaceCard {
            Text("Email", style = MaterialTheme.typography.labelMedium)
            Text(supplier.email)
            Text("Open balance", style = MaterialTheme.typography.labelMedium)
            Text(supplier.balance.asCurrency(), style = MaterialTheme.typography.titleLarge)
            FlowStatusChip(supplier.status.label(), supplier.status.color())
        }
        FlowSurfaceCard {
            Text("Notes", style = MaterialTheme.typography.titleMedium)
            Text(supplier.notes, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun SupplierEditorRoute(
    repository: DemoFlowRepository,
    supplierId: String?,
    onSaved: () -> Unit
) {
    val viewModel: SuppliersViewModel = viewModel(
        factory = flowViewModelFactory { SuppliersViewModel(repository) }
    )
    val suppliers by repository.suppliers.collectAsStateWithLifecycle()
    val existing = suppliers.firstOrNull { it.id == supplierId }

    var name by remember(existing?.id) { mutableStateOf(existing?.name ?: "") }
    var contact by remember(existing?.id) { mutableStateOf(existing?.contactPerson ?: "") }
    var phone by remember(existing?.id) { mutableStateOf(existing?.phone ?: "") }
    var email by remember(existing?.id) { mutableStateOf(existing?.email ?: "") }
    var notes by remember(existing?.id) { mutableStateOf(existing?.notes ?: "") }

    FlowDetailPage {
        FlowSectionHeader(
            title = if (existing == null) "Create supplier" else "Edit supplier",
            subtitle = "Keep supplier records ready for future Flow purchasing and payable depth."
        )
        FlowSurfaceCard {
            FlowTextField(name, { name = it }, "Supplier name")
            FlowTextField(contact, { contact = it }, "Contact person")
            FlowTextField(phone, { phone = it }, "Phone")
            FlowTextField(email, { email = it }, "Email")
            FlowTextField(notes, { notes = it }, "Notes", singleLine = false)
            FlowPrimaryButton(
                label = if (existing == null) "Save supplier" else "Update supplier",
                onClick = {
                    viewModel.saveSupplier(name, contact, phone, email, notes, existing?.id)
                    onSaved()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
