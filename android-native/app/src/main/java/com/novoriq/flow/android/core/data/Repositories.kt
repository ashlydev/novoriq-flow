package com.novoriq.flow.android.core.data

import com.novoriq.flow.android.core.model.BusinessProfile
import com.novoriq.flow.android.core.model.Customer
import com.novoriq.flow.android.core.model.DashboardSummary
import com.novoriq.flow.android.core.model.Expense
import com.novoriq.flow.android.core.model.FlowNotification
import com.novoriq.flow.android.core.model.FlowUser
import com.novoriq.flow.android.core.model.Invoice
import com.novoriq.flow.android.core.model.Payment
import com.novoriq.flow.android.core.model.SessionSnapshot
import com.novoriq.flow.android.core.model.Supplier
import kotlinx.coroutines.flow.StateFlow

interface SessionRepository {
    val session: StateFlow<SessionSnapshot>
    suspend fun signIn(email: String, password: String): Result<Unit>
    suspend fun signOut()
    suspend fun completeOnboarding(business: BusinessProfile)
}

interface FlowRepository {
    val dashboard: StateFlow<DashboardSummary>
    val customers: StateFlow<List<Customer>>
    val suppliers: StateFlow<List<Supplier>>
    val invoices: StateFlow<List<Invoice>>
    val payments: StateFlow<List<Payment>>
    val expenses: StateFlow<List<Expense>>
    val notifications: StateFlow<List<FlowNotification>>
    val currentUser: StateFlow<FlowUser?>

    suspend fun updateCurrentUser(user: FlowUser?)
    suspend fun saveCustomer(customer: Customer)
    suspend fun saveSupplier(supplier: Supplier)
    suspend fun saveInvoice(invoice: Invoice)
    suspend fun recordPayment(payment: Payment)
    suspend fun saveExpense(expense: Expense)
    suspend fun markNotificationRead(notificationId: String)
}

