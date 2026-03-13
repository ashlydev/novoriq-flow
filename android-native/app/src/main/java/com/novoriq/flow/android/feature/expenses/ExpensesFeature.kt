package com.novoriq.flow.android.feature.expenses

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
import com.novoriq.flow.android.core.model.Expense
import com.novoriq.flow.android.core.ui.FlowDetailPage
import com.novoriq.flow.android.feature.shared.asCurrency
import com.novoriq.flow.android.feature.shared.asFlowDate
import com.novoriq.flow.android.feature.shared.color
import com.novoriq.flow.android.feature.shared.label
import kotlinx.coroutines.launch
import java.time.LocalDate

class ExpensesViewModel(
    private val repository: DemoFlowRepository
) : ViewModel() {
    val expenses = repository.expenses

    fun saveExpense(
        title: String,
        category: String,
        amount: Double,
        notes: String,
        existingId: String? = null
    ) {
        viewModelScope.launch {
            repository.createExpense(title, category, amount, LocalDate.now(), notes, existingId)
        }
    }
}

@Composable
fun ExpensesRoute(
    repository: DemoFlowRepository,
    onOpenExpense: (String) -> Unit,
    onCreateExpense: () -> Unit
) {
    val viewModel: ExpensesViewModel = viewModel(
        factory = flowViewModelFactory { ExpensesViewModel(repository) }
    )
    val expenses by viewModel.expenses.collectAsStateWithLifecycle()

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        FlowSectionHeader("Expenses", "Capture day-to-day spend with category visibility and clean status presentation.")
        if (expenses.isEmpty()) {
            FlowEmptyState("No expenses yet", "Record operating costs to keep the dashboard and reports current.")
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(expenses, key = { it.id }) { expense ->
                    FlowListRow(
                        title = "${expense.title} • ${expense.amount.asCurrency()}",
                        subtitle = "${expense.category} • ${expense.date.asFlowDate()}",
                        trailing = { FlowStatusChip(expense.status.label(), expense.status.color()) },
                        onClick = { onOpenExpense(expense.id) }
                    )
                }
            }
        }
    }
}

@Composable
fun ExpenseFab(onClick: () -> Unit) {
    FloatingActionButton(onClick = onClick) {
        Icon(Icons.Outlined.Add, contentDescription = "Add expense")
    }
}

@Composable
fun ExpenseDetailRoute(repository: DemoFlowRepository, expenseId: String) {
    val expenses by repository.expenses.collectAsStateWithLifecycle()
    val expense = expenses.firstOrNull { it.id == expenseId }
    if (expense == null) {
        FlowEmptyState("Expense missing", "The expense record could not be found.")
        return
    }

    FlowDetailPage {
        FlowSectionHeader(expense.title, "${expense.category} • ${expense.date.asFlowDate()}")
        FlowSurfaceCard {
            Text(expense.amount.asCurrency(), style = MaterialTheme.typography.headlineMedium)
            FlowStatusChip(expense.status.label(), expense.status.color())
            Text(expense.notes, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun ExpenseEditorRoute(
    repository: DemoFlowRepository,
    expenseId: String?,
    onSaved: () -> Unit
) {
    val viewModel: ExpensesViewModel = viewModel(
        factory = flowViewModelFactory { ExpensesViewModel(repository) }
    )
    val expenses by repository.expenses.collectAsStateWithLifecycle()
    val existing = expenses.firstOrNull { it.id == expenseId }
    val categories = listOf("Transport", "Utilities", "Printing", "Operations", "Other")

    var title by remember(existing?.id) { mutableStateOf(existing?.title ?: "") }
    var amount by remember(existing?.id) { mutableStateOf(existing?.amount?.toString() ?: "") }
    var category by remember(existing?.id) { mutableStateOf(existing?.category ?: categories.first()) }
    var notes by remember(existing?.id) { mutableStateOf(existing?.notes ?: "") }

    FlowDetailPage {
        FlowSectionHeader(
            title = if (existing == null) "Create expense" else "Edit expense",
            subtitle = "Keep expense tracking fast and clean for a mobile-first finance surface."
        )
        FlowSurfaceCard {
            FlowTextField(title, { title = it }, "Expense title")
            FlowTextField(amount, { amount = it }, "Amount")
            Text("Category", style = MaterialTheme.typography.labelMedium)
            FlowChipRow {
                categories.forEach { entry ->
                    FlowFilterChip(label = entry, selected = category == entry, onClick = { category = entry })
                }
            }
            FlowTextField(notes, { notes = it }, "Notes", singleLine = false)
            FlowPrimaryButton(
                label = if (existing == null) "Save expense" else "Update expense",
                onClick = {
                    viewModel.saveExpense(title, category, amount.toDoubleOrNull() ?: 0.0, notes, existing?.id)
                    onSaved()
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
