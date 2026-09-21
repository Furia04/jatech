package com.example.jatechsat.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.jatechsat.data.model.UserProfile
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.theme.*
import com.example.jatechsat.ui.orders.OrdersScreen
import com.example.jatechsat.ui.partorders.PartOrdersScreen
import com.example.jatechsat.ui.scanner.QrScannerScreen
import kotlinx.coroutines.launch

enum class DashboardTab(val title: String, val icon: ImageVector) {
    ORDERS("Órdenes", Icons.Default.Build),
    PART_ORDERS("Repuestos", Icons.Default.ShoppingBag),
    SCANNER("Escanear", Icons.Default.QrCodeScanner),
    PROFILE("Mi Taller", Icons.Default.Store)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: UserProfile,
    repository: SatRepository,
    onSignOut: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(DashboardTab.ORDERS) }
    var shopName by remember { mutableStateOf("Mi Taller") }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(user.shopId) {
        user.shopId?.let { shopId ->
            repository.fetchCurrentShop(shopId).onSuccess { shop ->
                shopName = shop.name
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = shopName,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = if (user.role == "owner") "Administrador / Dueño" else "Técnico Especialista",
                            fontSize = 11.sp,
                            color = PrimaryCyan
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        coroutineScope.launch {
                            repository.signOut()
                            onSignOut()
                        }
                    }) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Cerrar Sesión",
                            tint = AccentRed
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceDark,
                tonalElevation = 8.dp
            ) {
                DashboardTab.values().forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        icon = {
                            Icon(
                                imageVector = tab.icon,
                                contentDescription = tab.title,
                                tint = if (selectedTab == tab) PrimaryCyan else TextSecondary
                            )
                        },
                        label = {
                            Text(
                                text = tab.title,
                                fontSize = 11.sp,
                                fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal,
                                color = if (selectedTab == tab) PrimaryCyan else TextSecondary
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = PrimaryCyan.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        },
        containerColor = BackgroundDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                DashboardTab.ORDERS -> OrdersScreen(
                    shopId = user.shopId ?: user.id,
                    shopName = shopName,
                    canViewMoney = user.canViewFinancials,
                    repository = repository
                )
                DashboardTab.PART_ORDERS -> PartOrdersScreen(
                    shopId = user.shopId ?: user.id,
                    shopName = shopName,
                    canViewMoney = user.canViewFinancials,
                    repository = repository
                )
                DashboardTab.SCANNER -> QrScannerScreen(
                    onCodeScanned = { code ->
                        // Switch to orders tab or search
                        selectedTab = DashboardTab.ORDERS
                    }
                )
                DashboardTab.PROFILE -> ProfileTab(
                    user = user,
                    shopName = shopName,
                    onSignOut = {
                        coroutineScope.launch {
                            repository.signOut()
                            onSignOut()
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun ProfileTab(
    user: UserProfile,
    shopName: String,
    onSignOut: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Información de la Cuenta", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 16.sp)
                HorizontalDivider(color = OutlineVariant)
                Text("Usuario: ${user.fullName ?: user.email}", color = TextSecondary, fontSize = 13.sp)
                Text("Email: ${user.email}", color = TextSecondary, fontSize = 13.sp)
                Text("Taller: $shopName", color = TextSecondary, fontSize = 13.sp)
                Text("Rol: ${user.role.uppercase()}", color = PrimaryCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = onSignOut,
            modifier = Modifier.fillMaxWidth().height(50.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
        ) {
            Icon(Icons.Default.Logout, contentDescription = null, tint = TextPrimary)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Cerrar Sesión", fontWeight = FontWeight.Bold, color = TextPrimary)
        }
    }
}
