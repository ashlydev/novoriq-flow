package com.novoriq.flow.android.core.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.RequestQuote
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material.icons.outlined.Menu
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.novoriq.flow.android.core.designsystem.FlowBackground
import com.novoriq.flow.android.core.designsystem.FlowDrawerBackground
import com.novoriq.flow.android.core.designsystem.FlowPrimary
import com.novoriq.flow.android.core.designsystem.FlowTextPrimary
import com.novoriq.flow.android.core.designsystem.FlowTextSecondary
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope

data class PrimaryDestination(
    val route: String,
    val label: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

val PrimaryDestinations = listOf(
    PrimaryDestination("dashboard", "Dashboard", Icons.Outlined.Dashboard),
    PrimaryDestination("customers", "Customers", Icons.Outlined.People),
    PrimaryDestination("invoices", "Invoices", Icons.AutoMirrored.Outlined.ReceiptLong),
    PrimaryDestination("expenses", "Expenses", Icons.Outlined.BarChart),
    PrimaryDestination("more", "More", Icons.Outlined.MoreHoriz)
)

val DrawerDestinations = listOf(
    PrimaryDestination("suppliers", "Suppliers", Icons.Outlined.People),
    PrimaryDestination("payments", "Payments", Icons.Outlined.RequestQuote),
    PrimaryDestination("notifications", "Notifications", Icons.Outlined.BarChart),
    PrimaryDestination("reports", "Reports", Icons.Outlined.BarChart),
    PrimaryDestination("settings", "Settings", Icons.Outlined.MoreHoriz)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlowAppScaffold(
    currentRoute: String,
    title: String,
    onNavigate: (String) -> Unit,
    onBack: (() -> Unit)? = null,
    floatingActionButton: (@Composable () -> Unit)? = null,
    content: @Composable (Modifier) -> Unit
) {
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(drawerContainerColor = FlowDrawerBackground) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    Text("Novoriq Flow", color = FlowTextPrimary)
                    Text("Android V1", color = FlowTextSecondary, modifier = Modifier.padding(bottom = 16.dp))
                    DrawerDestinations.forEach { destination ->
                        NavigationDrawerItem(
                            label = { Text(destination.label) },
                            selected = currentRoute == destination.route,
                            icon = { Icon(destination.icon, contentDescription = null) },
                            onClick = {
                                scope.launch { drawerState.close() }
                                onNavigate(destination.route)
                            }
                        )
                    }
                }
            }
        }
    ) {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            topBar = {
                TopAppBar(
                    title = { Text(title) },
                    navigationIcon = {
                        IconButton(
                            onClick = {
                                if (onBack != null) {
                                    onBack()
                                } else {
                                    scope.launch { drawerState.open() }
                                }
                            }
                        ) {
                            Icon(
                                if (onBack != null) Icons.Outlined.ChevronLeft else Icons.Outlined.Menu,
                                contentDescription = if (onBack != null) "Back" else "Menu"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = FlowBackground,
                        titleContentColor = FlowTextPrimary,
                        navigationIconContentColor = FlowTextPrimary
                    )
                )
            },
            bottomBar = {
                NavigationBar(
                    modifier = Modifier.navigationBarsPadding(),
                    containerColor = FlowBackground
                ) {
                    PrimaryDestinations.forEach { destination ->
                        NavigationBarItem(
                            selected = currentRoute == destination.route,
                            onClick = { onNavigate(destination.route) },
                            icon = { Icon(destination.icon, contentDescription = null) },
                            label = { Text(destination.label) }
                        )
                    }
                }
            },
            snackbarHost = { SnackbarHost(snackbarHostState) },
            floatingActionButton = {
                floatingActionButton?.invoke()
            },
            containerColor = FlowBackground,
            contentWindowInsets = WindowInsets(0, 0, 0, 0)
        ) { innerPadding ->
            content(Modifier.padding(innerPadding).padding(horizontal = 16.dp, vertical = 12.dp))
        }
    }
}

@Composable
fun FlowDetailPage(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .navigationBarsPadding(),
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(16.dp),
        content = content
    )
}
