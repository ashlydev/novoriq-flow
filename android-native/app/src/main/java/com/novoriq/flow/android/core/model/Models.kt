package com.novoriq.flow.android.core.model

import java.time.LocalDate

enum class UserRole { Owner, Admin, Manager, Staff }

data class FlowUser(
    val id: String,
    val fullName: String,
    val email: String,
    val role: UserRole,
    val branchName: String
)

data class BusinessProfile(
    val name: String,
    val type: String,
    val currency: String,
    val phone: String,
    val email: String
)

data class SessionSnapshot(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val hasCompletedOnboarding: Boolean = false,
    val user: FlowUser? = null,
    val business: BusinessProfile? = null
)

enum class RecordStatus { Draft, Sent, PartiallyPaid, Paid, Overdue, Active, Archived }

enum class AlertLevel { Info, Success, Warning, Error }

data class ActivityItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val dateLabel: String,
    val level: AlertLevel
)

data class AttentionItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val level: AlertLevel
)

data class DashboardSummary(
    val collectionsThisMonth: Double,
    val outstandingReceivables: Double,
    val expensesThisMonth: Double,
    val overdueInvoices: Int,
    val customerCount: Int,
    val supplierCount: Int,
    val invoiceCount: Int,
    val paymentsCount: Int,
    val recentActivity: List<ActivityItem>,
    val attentionItems: List<AttentionItem>,
    val reportSummary: String
)

data class Customer(
    val id: String,
    val name: String,
    val contactPerson: String,
    val phone: String,
    val email: String,
    val notes: String,
    val balance: Double,
    val status: RecordStatus = RecordStatus.Active
)

data class Supplier(
    val id: String,
    val name: String,
    val contactPerson: String,
    val phone: String,
    val email: String,
    val notes: String,
    val balance: Double,
    val status: RecordStatus = RecordStatus.Active
)

data class InvoiceLine(
    val id: String,
    val description: String,
    val quantity: Int,
    val unitPrice: Double
) {
    val total: Double = quantity * unitPrice
}

data class Invoice(
    val id: String,
    val number: String,
    val customerId: String,
    val customerName: String,
    val issueDate: LocalDate,
    val dueDate: LocalDate,
    val lines: List<InvoiceLine>,
    val status: RecordStatus,
    val notes: String,
    val paidAmount: Double
) {
    val totalAmount: Double = lines.sumOf { it.total }
    val outstandingAmount: Double = (totalAmount - paidAmount).coerceAtLeast(0.0)
}

enum class PaymentMethod { Cash, BankTransfer, MobileMoney, Card, Other }

data class Payment(
    val id: String,
    val invoiceId: String,
    val invoiceNumber: String,
    val customerName: String,
    val amount: Double,
    val method: PaymentMethod,
    val reference: String,
    val date: LocalDate,
    val notes: String
)

data class Expense(
    val id: String,
    val title: String,
    val category: String,
    val amount: Double,
    val date: LocalDate,
    val status: RecordStatus,
    val notes: String
)

data class FlowNotification(
    val id: String,
    val title: String,
    val message: String,
    val level: AlertLevel,
    val createdAt: LocalDate,
    val isRead: Boolean
)

