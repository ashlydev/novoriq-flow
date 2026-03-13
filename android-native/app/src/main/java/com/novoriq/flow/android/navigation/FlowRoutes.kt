package com.novoriq.flow.android.navigation

object FlowRoutes {
    const val Dashboard = "dashboard"
    const val Customers = "customers"
    const val CustomerCreate = "customers/new"
    const val CustomerDetail = "customers/{customerId}"
    fun customerDetail(customerId: String) = "customers/$customerId"

    const val Suppliers = "suppliers"
    const val SupplierCreate = "suppliers/new"
    const val SupplierDetail = "suppliers/{supplierId}"
    fun supplierDetail(supplierId: String) = "suppliers/$supplierId"

    const val Invoices = "invoices"
    const val InvoiceCreate = "invoices/new"
    const val InvoiceDetail = "invoices/{invoiceId}"
    fun invoiceDetail(invoiceId: String) = "invoices/$invoiceId"

    const val Payments = "payments"
    const val PaymentCreate = "payments/new"
    const val PaymentDetail = "payments/{paymentId}"
    fun paymentDetail(paymentId: String) = "payments/$paymentId"
    fun paymentCreate(invoiceId: String? = null) =
        if (invoiceId == null) PaymentCreate else "$PaymentCreate?invoiceId=$invoiceId"

    const val Expenses = "expenses"
    const val ExpenseCreate = "expenses/new"
    const val ExpenseDetail = "expenses/{expenseId}"
    fun expenseDetail(expenseId: String) = "expenses/$expenseId"

    const val Notifications = "notifications"
    const val Settings = "settings"
    const val Reports = "reports"
    const val More = "more"
}

