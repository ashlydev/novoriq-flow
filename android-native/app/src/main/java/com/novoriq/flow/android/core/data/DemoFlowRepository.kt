package com.novoriq.flow.android.core.data

import com.novoriq.flow.android.core.model.AlertLevel
import com.novoriq.flow.android.core.model.BusinessProfile
import com.novoriq.flow.android.core.model.Customer
import com.novoriq.flow.android.core.model.DashboardSummary
import com.novoriq.flow.android.core.model.Expense
import com.novoriq.flow.android.core.model.FlowNotification
import com.novoriq.flow.android.core.model.FlowUser
import com.novoriq.flow.android.core.model.Invoice
import com.novoriq.flow.android.core.model.Payment
import com.novoriq.flow.android.core.model.RecordStatus
import com.novoriq.flow.android.core.model.SessionSnapshot
import com.novoriq.flow.android.core.model.Supplier
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.LocalDate
import java.util.UUID

class DemoSessionRepository(
    private val store: SessionStore,
    private val appScope: CoroutineScope,
    private val flowRepository: DemoFlowRepository
) : SessionRepository {
    override val session: StateFlow<SessionSnapshot> = store.session
        .stateIn(appScope, SharingStarted.Eagerly, SessionSnapshot(isLoading = true))

    override suspend fun signIn(email: String, password: String): Result<Unit> {
        delay(550)
        if (email.isBlank() || password.isBlank()) {
            return Result.failure(IllegalArgumentException("Email and password are required."))
        }
        val user = DemoSeed.defaultUser.copy(email = email.trim())
        store.persistLogin(user)
        flowRepository.updateCurrentUser(user)
        return Result.success(Unit)
    }

    override suspend fun signOut() {
        store.clearSession()
        flowRepository.updateCurrentUser(null)
    }

    override suspend fun completeOnboarding(business: BusinessProfile) {
        store.persistOnboarding(business)
    }
}

class DemoFlowRepository(
    private val appScope: CoroutineScope
) : FlowRepository {
    private data class DashboardSource(
        val customers: List<Customer>,
        val suppliers: List<Supplier>,
        val invoices: List<Invoice>,
        val payments: List<Payment>,
        val expenses: List<Expense>
    )

    private val mutex = Mutex()
    private val customersState = MutableStateFlow(DemoSeed.customers)
    private val suppliersState = MutableStateFlow(DemoSeed.suppliers)
    private val invoicesState = MutableStateFlow(DemoSeed.invoices)
    private val paymentsState = MutableStateFlow(DemoSeed.payments)
    private val expensesState = MutableStateFlow(DemoSeed.expenses)
    private val notificationsState = MutableStateFlow(DemoSeed.notifications)
    private val currentUserState = MutableStateFlow<FlowUser?>(DemoSeed.defaultUser)

    override val currentUser: StateFlow<FlowUser?> = currentUserState
    override val customers: StateFlow<List<Customer>> = customersState
    override val suppliers: StateFlow<List<Supplier>> = suppliersState
    override val invoices: StateFlow<List<Invoice>> = invoicesState
    override val payments: StateFlow<List<Payment>> = paymentsState
    override val expenses: StateFlow<List<Expense>> = expensesState
    override val notifications: StateFlow<List<FlowNotification>> = notificationsState

    private val dashboardSource = combine(
        customersState,
        suppliersState,
        invoicesState,
        paymentsState,
        expensesState
    ) { customers, suppliers, invoices, payments, expenses ->
        DashboardSource(customers, suppliers, invoices, payments, expenses)
    }

    override val dashboard: StateFlow<DashboardSummary> = combine(
        dashboardSource,
        notificationsState
    ) { source, notifications ->
        DemoSeed.dashboard(
            source.customers,
            source.suppliers,
            source.invoices,
            source.payments,
            source.expenses,
            notifications
        )
    }.stateIn(
        appScope,
        SharingStarted.Eagerly,
        DemoSeed.dashboard(
            DemoSeed.customers,
            DemoSeed.suppliers,
            DemoSeed.invoices,
            DemoSeed.payments,
            DemoSeed.expenses,
            DemoSeed.notifications
        )
    )

    override suspend fun updateCurrentUser(user: FlowUser?) {
        currentUserState.value = user
    }

    override suspend fun saveCustomer(customer: Customer) {
        mutex.withLock {
            customersState.value = customersState.value.upsert(customer) { it.id }
            pushNotification(
                title = if (customer.id.startsWith("cust-new")) "Customer created" else "Customer updated",
                message = "${customer.name} is now available in Novoriq Flow.",
                level = AlertLevel.Info
            )
        }
    }

    override suspend fun saveSupplier(supplier: Supplier) {
        mutex.withLock {
            suppliersState.value = suppliersState.value.upsert(supplier) { it.id }
            pushNotification(
                title = if (supplier.id.startsWith("sup-new")) "Supplier created" else "Supplier updated",
                message = "${supplier.name} is now available in Novoriq Flow.",
                level = AlertLevel.Info
            )
        }
    }

    override suspend fun saveInvoice(invoice: Invoice) {
        mutex.withLock {
            invoicesState.value = invoicesState.value.upsert(invoice) { it.id }
            pushNotification(
                title = "Invoice saved",
                message = "${invoice.number} for ${invoice.customerName} is ready.",
                level = if (invoice.status == RecordStatus.Overdue) AlertLevel.Warning else AlertLevel.Success
            )
        }
    }

    override suspend fun recordPayment(payment: Payment) {
        mutex.withLock {
            paymentsState.value = listOf(payment) + paymentsState.value
            invoicesState.value = invoicesState.value.map { invoice ->
                if (invoice.id != payment.invoiceId) return@map invoice
                val nextPaid = invoice.paidAmount + payment.amount
                val nextStatus = when {
                    nextPaid >= invoice.totalAmount -> RecordStatus.Paid
                    nextPaid > 0 -> RecordStatus.PartiallyPaid
                    invoice.dueDate.isBefore(LocalDate.now()) -> RecordStatus.Overdue
                    else -> invoice.status
                }
                invoice.copy(paidAmount = nextPaid, status = nextStatus)
            }
            pushNotification(
                title = "Payment recorded",
                message = "${payment.customerName} paid ${payment.amount.currencyString()} on ${payment.invoiceNumber}.",
                level = AlertLevel.Success
            )
        }
    }

    override suspend fun saveExpense(expense: Expense) {
        mutex.withLock {
            expensesState.value = expensesState.value.upsert(expense) { it.id }
            pushNotification(
                title = "Expense saved",
                message = "${expense.title} was recorded under ${expense.category}.",
                level = AlertLevel.Info
            )
        }
    }

    override suspend fun markNotificationRead(notificationId: String) {
        notificationsState.value = notificationsState.value.map { notification ->
            if (notification.id == notificationId) notification.copy(isRead = true) else notification
        }
    }

    suspend fun createCustomer(
        name: String,
        contact: String,
        phone: String,
        email: String,
        notes: String,
        existingId: String? = null
    ) = saveCustomer(
        Customer(
            id = existingId ?: "cust-new-${UUID.randomUUID()}",
            name = name,
            contactPerson = contact,
            phone = phone,
            email = email,
            notes = notes,
            balance = customersState.value.firstOrNull { it.id == existingId }?.balance ?: 0.0
        )
    )

    suspend fun createSupplier(
        name: String,
        contact: String,
        phone: String,
        email: String,
        notes: String,
        existingId: String? = null
    ) = saveSupplier(
        Supplier(
            id = existingId ?: "sup-new-${UUID.randomUUID()}",
            name = name,
            contactPerson = contact,
            phone = phone,
            email = email,
            notes = notes,
            balance = suppliersState.value.firstOrNull { it.id == existingId }?.balance ?: 0.0
        )
    )

    suspend fun createInvoice(
        customerId: String,
        title: String,
        amount: Double,
        dueDate: LocalDate,
        notes: String,
        existingId: String? = null
    ) {
        val customer = customersState.value.firstOrNull { it.id == customerId } ?: return
        val existing = invoicesState.value.firstOrNull { it.id == existingId }
        val invoice = Invoice(
            id = existingId ?: "inv-new-${UUID.randomUUID()}",
            number = existing?.number ?: "INV-${LocalDate.now().year}-${invoicesState.value.size + 20}",
            customerId = customer.id,
            customerName = customer.name,
            issueDate = existing?.issueDate ?: LocalDate.now(),
            dueDate = dueDate,
            lines = listOf(
                com.novoriq.flow.android.core.model.InvoiceLine(
                    id = "line-${UUID.randomUUID()}",
                    description = title,
                    quantity = 1,
                    unitPrice = amount
                )
            ),
            status = when {
                existing?.paidAmount ?: 0.0 >= amount -> RecordStatus.Paid
                existing?.paidAmount ?: 0.0 > 0.0 -> RecordStatus.PartiallyPaid
                dueDate.isBefore(LocalDate.now()) -> RecordStatus.Overdue
                else -> RecordStatus.Sent
            },
            notes = notes,
            paidAmount = existing?.paidAmount ?: 0.0
        )
        saveInvoice(invoice)
    }

    suspend fun createExpense(
        title: String,
        category: String,
        amount: Double,
        date: LocalDate,
        notes: String,
        existingId: String? = null
    ) = saveExpense(
        Expense(
            id = existingId ?: "exp-new-${UUID.randomUUID()}",
            title = title,
            category = category,
            amount = amount,
            date = date,
            status = RecordStatus.Active,
            notes = notes
        )
    )

    suspend fun createPayment(
        invoiceId: String,
        amount: Double,
        method: com.novoriq.flow.android.core.model.PaymentMethod,
        reference: String,
        notes: String
    ) {
        val invoice = invoicesState.value.firstOrNull { it.id == invoiceId } ?: return
        recordPayment(
            Payment(
                id = "pay-new-${UUID.randomUUID()}",
                invoiceId = invoice.id,
                invoiceNumber = invoice.number,
                customerName = invoice.customerName,
                amount = amount,
                method = method,
                reference = reference,
                date = LocalDate.now(),
                notes = notes
            )
        )
    }

    private fun pushNotification(title: String, message: String, level: AlertLevel) {
        notificationsState.value = listOf(
            FlowNotification(
                id = "note-${UUID.randomUUID()}",
                title = title,
                message = message,
                level = level,
                createdAt = LocalDate.now(),
                isRead = false
            )
        ) + notificationsState.value
    }
}

private fun <T> List<T>.upsert(item: T, key: (T) -> String): List<T> {
    val existingIndex = indexOfFirst { key(it) == key(item) }
    return if (existingIndex >= 0) {
        toMutableList().apply { set(existingIndex, item) }
    } else {
        listOf(item) + this
    }
}

private fun Double.currencyString(): String = "USD ${"%,.2f".format(this)}"
