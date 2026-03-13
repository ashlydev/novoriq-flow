package com.novoriq.flow.android.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.novoriq.flow.android.core.data.flowAppContainer
import com.novoriq.flow.android.core.designsystem.FlowLoadingPane
import com.novoriq.flow.android.core.designsystem.FlowTheme
import com.novoriq.flow.android.core.ui.FlowAppScaffold
import com.novoriq.flow.android.feature.auth.AuthRoute
import com.novoriq.flow.android.feature.customers.CustomerDetailRoute
import com.novoriq.flow.android.feature.customers.CustomerEditorRoute
import com.novoriq.flow.android.feature.customers.CustomerFab
import com.novoriq.flow.android.feature.customers.CustomersRoute
import com.novoriq.flow.android.feature.dashboard.DashboardRoute
import com.novoriq.flow.android.feature.expenses.ExpenseDetailRoute
import com.novoriq.flow.android.feature.expenses.ExpenseEditorRoute
import com.novoriq.flow.android.feature.expenses.ExpenseFab
import com.novoriq.flow.android.feature.expenses.ExpensesRoute
import com.novoriq.flow.android.feature.invoices.InvoiceDetailRoute
import com.novoriq.flow.android.feature.invoices.InvoiceEditorRoute
import com.novoriq.flow.android.feature.invoices.InvoiceFab
import com.novoriq.flow.android.feature.invoices.InvoicesRoute
import com.novoriq.flow.android.feature.notifications.NotificationsRoute
import com.novoriq.flow.android.feature.onboarding.OnboardingRoute
import com.novoriq.flow.android.feature.payments.PaymentDetailRoute
import com.novoriq.flow.android.feature.payments.PaymentEditorRoute
import com.novoriq.flow.android.feature.payments.PaymentFab
import com.novoriq.flow.android.feature.payments.PaymentsRoute
import com.novoriq.flow.android.feature.reports.ReportsRoute
import com.novoriq.flow.android.feature.settings.MoreRoute
import com.novoriq.flow.android.feature.settings.SettingsRoute
import com.novoriq.flow.android.feature.suppliers.SupplierDetailRoute
import com.novoriq.flow.android.feature.suppliers.SupplierEditorRoute
import com.novoriq.flow.android.feature.suppliers.SupplierFab
import com.novoriq.flow.android.feature.suppliers.SuppliersRoute
import com.novoriq.flow.android.navigation.FlowRoutes

@Composable
fun FlowRoot() {
    val context = LocalContext.current
    val container = context.flowAppContainer
    val session by container.sessionRepository.session.collectAsStateWithLifecycle()

    FlowTheme {
        when {
            session.isLoading -> FlowLoadingPane()
            !session.isAuthenticated -> AuthRoute(container.sessionRepository)
            !session.hasCompletedOnboarding -> OnboardingRoute(container.sessionRepository)
            else -> FlowMainShell()
        }
    }
}

@Composable
private fun FlowMainShell() {
    val context = LocalContext.current
    val container = context.flowAppContainer
    val navController = rememberNavController()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val route = currentBackStackEntry?.destination?.route ?: FlowRoutes.Dashboard
    val topLevelRoute = topLevelRoute(route)
    val isTopLevel = topLevelRoute == route

    FlowAppScaffold(
        currentRoute = topLevelRoute,
        title = titleForRoute(route),
        onNavigate = { destination ->
            navController.navigate(destination) {
                launchSingleTop = true
                restoreState = true
                popUpTo(FlowRoutes.Dashboard) { saveState = true }
            }
        },
        onBack = if (isTopLevel) null else ({ navController.popBackStack() }),
        floatingActionButton = when (topLevelRoute) {
            FlowRoutes.Customers -> ({ CustomerFab { navController.navigate(FlowRoutes.CustomerCreate) } })
            FlowRoutes.Suppliers -> ({ SupplierFab { navController.navigate(FlowRoutes.SupplierCreate) } })
            FlowRoutes.Invoices -> ({ InvoiceFab { navController.navigate(FlowRoutes.InvoiceCreate) } })
            FlowRoutes.Payments -> ({ PaymentFab { navController.navigate(FlowRoutes.PaymentCreate) } })
            FlowRoutes.Expenses -> ({ ExpenseFab { navController.navigate(FlowRoutes.ExpenseCreate) } })
            else -> null
        }
    ) { modifier ->
        NavHost(
            navController = navController,
            startDestination = FlowRoutes.Dashboard,
            modifier = modifier
        ) {
            composable(FlowRoutes.Dashboard) {
                DashboardRoute(container.flowRepository) { navController.navigate(it) }
            }
            composable(FlowRoutes.Customers) {
                CustomersRoute(
                    repository = container.flowRepository,
                    onOpenCustomer = { navController.navigate(FlowRoutes.customerDetail(it)) },
                    onCreateCustomer = { navController.navigate(FlowRoutes.CustomerCreate) }
                )
            }
            composable(FlowRoutes.CustomerCreate) {
                CustomerEditorRoute(container.flowRepository, null) { navController.popBackStack() }
            }
            composable(
                route = FlowRoutes.CustomerDetail,
                arguments = listOf(navArgument("customerId") { type = NavType.StringType })
            ) {
                val customerId = it.arguments?.getString("customerId").orEmpty()
                CustomerDetailRoute(container.flowRepository, customerId)
            }

            composable(FlowRoutes.Suppliers) {
                SuppliersRoute(
                    repository = container.flowRepository,
                    onOpenSupplier = { navController.navigate(FlowRoutes.supplierDetail(it)) },
                    onCreateSupplier = { navController.navigate(FlowRoutes.SupplierCreate) }
                )
            }
            composable(FlowRoutes.SupplierCreate) {
                SupplierEditorRoute(container.flowRepository, null) { navController.popBackStack() }
            }
            composable(
                route = FlowRoutes.SupplierDetail,
                arguments = listOf(navArgument("supplierId") { type = NavType.StringType })
            ) {
                val supplierId = it.arguments?.getString("supplierId").orEmpty()
                SupplierDetailRoute(container.flowRepository, supplierId)
            }

            composable(FlowRoutes.Invoices) {
                InvoicesRoute(
                    repository = container.flowRepository,
                    onOpenInvoice = { navController.navigate(FlowRoutes.invoiceDetail(it)) },
                    onCreateInvoice = { navController.navigate(FlowRoutes.InvoiceCreate) }
                )
            }
            composable(FlowRoutes.InvoiceCreate) {
                InvoiceEditorRoute(container.flowRepository, null) { navController.popBackStack() }
            }
            composable(
                route = FlowRoutes.InvoiceDetail,
                arguments = listOf(navArgument("invoiceId") { type = NavType.StringType })
            ) {
                val invoiceId = it.arguments?.getString("invoiceId").orEmpty()
                InvoiceDetailRoute(container.flowRepository, invoiceId) { id ->
                    navController.navigate(FlowRoutes.paymentCreate(id))
                }
            }

            composable(FlowRoutes.Payments) {
                PaymentsRoute(
                    repository = container.flowRepository,
                    onOpenPayment = { navController.navigate(FlowRoutes.paymentDetail(it)) },
                    onCreatePayment = { navController.navigate(FlowRoutes.PaymentCreate) }
                )
            }
            composable(
                route = "${FlowRoutes.PaymentCreate}?invoiceId={invoiceId}",
                arguments = listOf(navArgument("invoiceId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                })
            ) {
                PaymentEditorRoute(
                    repository = container.flowRepository,
                    preselectedInvoiceId = it.arguments?.getString("invoiceId")
                ) { navController.popBackStack() }
            }
            composable(
                route = FlowRoutes.PaymentDetail,
                arguments = listOf(navArgument("paymentId") { type = NavType.StringType })
            ) {
                val paymentId = it.arguments?.getString("paymentId").orEmpty()
                PaymentDetailRoute(container.flowRepository, paymentId)
            }

            composable(FlowRoutes.Expenses) {
                ExpensesRoute(
                    repository = container.flowRepository,
                    onOpenExpense = { navController.navigate(FlowRoutes.expenseDetail(it)) },
                    onCreateExpense = { navController.navigate(FlowRoutes.ExpenseCreate) }
                )
            }
            composable(FlowRoutes.ExpenseCreate) {
                ExpenseEditorRoute(container.flowRepository, null) { navController.popBackStack() }
            }
            composable(
                route = FlowRoutes.ExpenseDetail,
                arguments = listOf(navArgument("expenseId") { type = NavType.StringType })
            ) {
                val expenseId = it.arguments?.getString("expenseId").orEmpty()
                ExpenseDetailRoute(container.flowRepository, expenseId)
            }

            composable(FlowRoutes.Notifications) {
                NotificationsRoute(container.flowRepository)
            }
            composable(FlowRoutes.Reports) {
                ReportsRoute(container.flowRepository)
            }
            composable(FlowRoutes.Settings) {
                SettingsRoute(container.sessionRepository)
            }
            composable(FlowRoutes.More) {
                MoreRoute(
                    onSuppliers = { navController.navigate(FlowRoutes.Suppliers) },
                    onPayments = { navController.navigate(FlowRoutes.Payments) },
                    onNotifications = { navController.navigate(FlowRoutes.Notifications) },
                    onReports = { navController.navigate(FlowRoutes.Reports) },
                    onSettings = { navController.navigate(FlowRoutes.Settings) }
                )
            }
        }
    }
}

private fun topLevelRoute(route: String): String = when {
    route.startsWith("customers") -> FlowRoutes.Customers
    route.startsWith("suppliers") -> FlowRoutes.Suppliers
    route.startsWith("invoices") -> FlowRoutes.Invoices
    route.startsWith("payments") -> FlowRoutes.Payments
    route.startsWith("expenses") -> FlowRoutes.Expenses
    route.startsWith("notifications") -> FlowRoutes.Notifications
    route.startsWith("reports") -> FlowRoutes.Reports
    route.startsWith("settings") -> FlowRoutes.Settings
    route.startsWith("more") -> FlowRoutes.More
    else -> FlowRoutes.Dashboard
}

private fun titleForRoute(route: String): String = when {
    route.startsWith("customers/new") -> "New customer"
    route.startsWith("customers/") -> "Customer detail"
    route.startsWith("suppliers/new") -> "New supplier"
    route.startsWith("suppliers/") -> "Supplier detail"
    route.startsWith("invoices/new") -> "New invoice"
    route.startsWith("invoices/") -> "Invoice detail"
    route.startsWith("payments/new") -> "Record payment"
    route.startsWith("payments/") -> "Payment detail"
    route.startsWith("expenses/new") -> "New expense"
    route.startsWith("expenses/") -> "Expense detail"
    route.startsWith("customers") -> "Customers"
    route.startsWith("suppliers") -> "Suppliers"
    route.startsWith("invoices") -> "Invoices"
    route.startsWith("payments") -> "Payments"
    route.startsWith("expenses") -> "Expenses"
    route.startsWith("notifications") -> "Notifications"
    route.startsWith("reports") -> "Reports"
    route.startsWith("settings") -> "Settings"
    route.startsWith("more") -> "More"
    else -> "Dashboard"
}
