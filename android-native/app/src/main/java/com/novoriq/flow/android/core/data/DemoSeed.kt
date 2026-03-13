package com.novoriq.flow.android.core.data

import com.novoriq.flow.android.core.model.ActivityItem
import com.novoriq.flow.android.core.model.AlertLevel
import com.novoriq.flow.android.core.model.AttentionItem
import com.novoriq.flow.android.core.model.BusinessProfile
import com.novoriq.flow.android.core.model.Customer
import com.novoriq.flow.android.core.model.DashboardSummary
import com.novoriq.flow.android.core.model.Expense
import com.novoriq.flow.android.core.model.FlowNotification
import com.novoriq.flow.android.core.model.FlowUser
import com.novoriq.flow.android.core.model.Invoice
import com.novoriq.flow.android.core.model.InvoiceLine
import com.novoriq.flow.android.core.model.Payment
import com.novoriq.flow.android.core.model.PaymentMethod
import com.novoriq.flow.android.core.model.RecordStatus
import com.novoriq.flow.android.core.model.Supplier
import com.novoriq.flow.android.core.model.UserRole
import java.time.LocalDate

object DemoSeed {
    val defaultUser = FlowUser(
        id = "user-owner",
        fullName = "Ashley Dube",
        email = "owner@novoriq.demo",
        role = UserRole.Owner,
        branchName = "Harare HQ"
    )

    val defaultBusiness = BusinessProfile(
        name = "Novoriq Flow Demo Business",
        type = "Wholesale & Services",
        currency = "USD",
        phone = "+263 77 123 4567",
        email = "ops@novoriq.demo"
    )

    val customers = listOf(
        Customer("cust-1", "BluePeak Logistics", "Rudo Moyo", "+263 77 900 1122", "accounts@bluepeak.co.zw", "Pays on 14-day terms.", 1640.0),
        Customer("cust-2", "Apex Digital Studio", "Tafadzwa Ncube", "+263 71 440 0101", "finance@apexdigital.africa", "Repeat invoice client.", 520.0),
        Customer("cust-3", "Crestline Hardware", "Simba Dube", "+263 78 555 0082", "admin@crestlinehw.com", "Needs proactive follow-up.", 0.0)
    )

    val suppliers = listOf(
        Supplier("sup-1", "Metro Supply Chain", "Lynette Zhou", "+263 78 100 3300", "sales@metrosupply.africa", "Primary packaging supplier.", 1180.0),
        Supplier("sup-2", "Nimbus Print Works", "Kelvin Masuku", "+263 77 600 5500", "studio@nimbusprint.co.zw", "Fast turnaround.", 340.0),
        Supplier("sup-3", "Nova Office Mart", "Chipo Matarira", "+263 71 909 1000", "ops@novaoffice.co.zw", "Office consumables.", 0.0)
    )

    val invoices = listOf(
        Invoice(
            id = "inv-1",
            number = "INV-2026-014",
            customerId = "cust-1",
            customerName = "BluePeak Logistics",
            issueDate = LocalDate.now().minusDays(11),
            dueDate = LocalDate.now().minusDays(2),
            lines = listOf(InvoiceLine("line-1", "Monthly dispatch support", 1, 1840.0)),
            status = RecordStatus.Overdue,
            notes = "Operations retainer for March coverage.",
            paidAmount = 200.0
        ),
        Invoice(
            id = "inv-2",
            number = "INV-2026-016",
            customerId = "cust-2",
            customerName = "Apex Digital Studio",
            issueDate = LocalDate.now().minusDays(5),
            dueDate = LocalDate.now().plusDays(7),
            lines = listOf(InvoiceLine("line-2", "Campaign reporting sprint", 1, 920.0)),
            status = RecordStatus.PartiallyPaid,
            notes = "Includes retainer top-up.",
            paidAmount = 400.0
        ),
        Invoice(
            id = "inv-3",
            number = "INV-2026-019",
            customerId = "cust-3",
            customerName = "Crestline Hardware",
            issueDate = LocalDate.now().minusDays(2),
            dueDate = LocalDate.now().plusDays(12),
            lines = listOf(InvoiceLine("line-3", "Store rollout consulting", 1, 640.0)),
            status = RecordStatus.Sent,
            notes = "Awaiting approval from branch manager.",
            paidAmount = 0.0
        )
    )

    val payments = listOf(
        Payment("pay-1", "inv-1", "INV-2026-014", "BluePeak Logistics", 200.0, PaymentMethod.BankTransfer, "BKP-55321", LocalDate.now().minusDays(5), "Partial settlement"),
        Payment("pay-2", "inv-2", "INV-2026-016", "Apex Digital Studio", 400.0, PaymentMethod.MobileMoney, "MM-88320", LocalDate.now().minusDays(1), "Retainer installment")
    )

    val expenses = listOf(
        Expense("exp-1", "Fuel and delivery runs", "Transport", 280.0, LocalDate.now().minusDays(2), RecordStatus.Active, "Branch collections and dispatches"),
        Expense("exp-2", "Design print proofs", "Printing", 120.0, LocalDate.now().minusDays(4), RecordStatus.Active, "Campaign proofing set"),
        Expense("exp-3", "Office internet", "Utilities", 95.0, LocalDate.now().minusDays(6), RecordStatus.Active, "Fiber renewal")
    )

    val notifications = listOf(
        FlowNotification("note-1", "Invoice overdue", "BluePeak Logistics is 2 days overdue on INV-2026-014.", AlertLevel.Warning, LocalDate.now(), false),
        FlowNotification("note-2", "Payment received", "Apex Digital Studio settled USD 400 on INV-2026-016.", AlertLevel.Success, LocalDate.now().minusDays(1), false),
        FlowNotification("note-3", "Expense recorded", "Fuel and delivery runs was added under Transport.", AlertLevel.Info, LocalDate.now().minusDays(2), true)
    )

    fun dashboard(
        customers: List<Customer>,
        suppliers: List<Supplier>,
        invoices: List<Invoice>,
        payments: List<Payment>,
        expenses: List<Expense>,
        notifications: List<FlowNotification>
    ): DashboardSummary {
        return DashboardSummary(
            collectionsThisMonth = payments.sumOf { it.amount },
            outstandingReceivables = invoices.sumOf { it.outstandingAmount },
            expensesThisMonth = expenses.sumOf { it.amount },
            overdueInvoices = invoices.count { it.status == RecordStatus.Overdue },
            customerCount = customers.size,
            supplierCount = suppliers.size,
            invoiceCount = invoices.size,
            paymentsCount = payments.size,
            recentActivity = listOf(
                ActivityItem("activity-1", "Payment recorded", "Apex Digital Studio paid USD 400", "Today", AlertLevel.Success),
                ActivityItem("activity-2", "Expense added", "Fuel and delivery runs logged", "2 days ago", AlertLevel.Info),
                ActivityItem("activity-3", "Invoice overdue", "BluePeak Logistics still outstanding", "2 days overdue", AlertLevel.Warning)
            ),
            attentionItems = listOf(
                AttentionItem("attention-1", "Overdue receivable", "Follow up BluePeak Logistics on INV-2026-014.", AlertLevel.Warning),
                AttentionItem("attention-2", "Supplier balance due", "Metro Supply Chain balance remains open this week.", AlertLevel.Info),
                AttentionItem("attention-3", "Unread updates", "${notifications.count { !it.isRead }} notifications need review.", AlertLevel.Info)
            ),
            reportSummary = "Collections are steady, but overdue receivables and supplier balances still need follow-up."
        )
    }
}
