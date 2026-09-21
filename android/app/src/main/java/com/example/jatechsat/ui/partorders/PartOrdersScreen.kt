package com.example.jatechsat.ui.partorders

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.jatechsat.data.model.PartOrder
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.theme.*
import com.example.jatechsat.util.WhatsAppHelper
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PartOrdersScreen(
    shopId: String,
    shopName: String,
    canViewMoney: Boolean,
    repository: SatRepository
) {
    var partOrders by remember { mutableStateOf<List<PartOrder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var showNewDialog by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    val loadPartOrders = {
        isLoading = true
        coroutineScope.launch {
            repository.fetchPartOrders(shopId).onSuccess { list ->
                partOrders = list
            }
            isLoading = false
        }
    }

    LaunchedEffect(shopId) {
        loadPartOrders()
    }

    val filteredOrders = partOrders.filter { order ->
        val q = searchQuery.lowercase()
        order.customerName.lowercase().contains(q) ||
        order.customerPhone.lowercase().contains(q) ||
        order.partName.lowercase().contains(q) ||
        (order.deviceModel?.lowercase()?.contains(q) == true) ||
        (order.notes?.lowercase()?.contains(q) == true)
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showNewDialog = true },
                containerColor = PrimaryCyan,
                contentColor = OnPrimaryDark,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Encargar Repuesto")
            }
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Buscar repuesto o cliente...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryCyan) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = null, tint = TextSecondary)
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryCyan,
                    unfocusedBorderColor = OutlineVariant,
                    focusedLabelColor = PrimaryCyan,
                    unfocusedLabelColor = TextSecondary,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark
                )
            )

            // Content
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryCyan)
                }
            } else if (filteredOrders.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.ShoppingBag, contentDescription = null, tint = TextMuted, modifier = Modifier.size(48.dp))
                        Text(
                            if (searchQuery.isEmpty()) "No hay repuestos pedidos registrados." else "No se encontraron coincidencias.",
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredOrders, key = { it.id }) { order ->
                        PartOrderCard(
                            order = order,
                            canViewMoney = canViewMoney,
                            onStatusChange = { newStatus ->
                                coroutineScope.launch {
                                    repository.updatePartOrderStatus(order.id, newStatus)
                                    loadPartOrders()
                                }
                            },
                            onWhatsAppClick = {
                                val msg = WhatsAppHelper.generatePartArrivedMessage(order, shopName)
                                WhatsAppHelper.openWhatsApp(context, order.customerPhone, msg)
                            },
                            onDelete = {
                                coroutineScope.launch {
                                    repository.deletePartOrder(order.id)
                                    loadPartOrders()
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    if (showNewDialog) {
        NewPartOrderDialog(
            shopId = shopId,
            repository = repository,
            onDismiss = { showNewDialog = false },
            onOrderCreated = {
                showNewDialog = false
                loadPartOrders()
            }
        )
    }
}

@Composable
fun PartOrderCard(
    order: PartOrder,
    canViewMoney: Boolean,
    onStatusChange: (String) -> Unit,
    onWhatsAppClick: () -> Unit,
    onDelete: () -> Unit
) {
    var expandedMenu by remember { mutableStateOf(false) }

    val statusColor = when (order.status) {
        "pending" -> AccentAmber
        "arrived" -> AccentEmerald
        "delivered" -> TextSecondary
        "cancelled" -> AccentRed
        else -> TextMuted
    }

    val statusLabel = when (order.status) {
        "pending" -> "Pendiente / En Camino"
        "arrived" -> "¡Llegó al Taller!"
        "delivered" -> "Entregado / Colocado"
        "cancelled" -> "Cancelado"
        else -> order.status
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header: Status and Delete
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = statusColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = statusLabel,
                        color = statusColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = TextMuted, modifier = Modifier.size(18.dp))
                }
            }

            // Part Name and Device
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = order.partName,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                if (!order.deviceModel.isNullOrBlank()) {
                    Text(
                        text = "Para: ${order.deviceModel}",
                        fontSize = 12.sp,
                        color = AccentViolet,
                        fontWeight = FontWeight.Medium
                    )
                }
                Text(
                    text = "Cliente: ${order.customerName} · ${order.customerPhone}",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }

            // Notes
            if (!order.notes.isNullOrBlank()) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = SurfaceContainerHighest,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Notas: ${order.notes}",
                        fontSize = 12.sp,
                        color = TextSecondary,
                        modifier = Modifier.padding(10.dp)
                    )
                }
            }

            // Financials
            if (canViewMoney) {
                val expected = order.expectedPrice ?: 0.0
                val advance = order.advancePayment ?: 0.0
                val remaining = (expected - advance).coerceAtLeast(0.0)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (advance > 0) "Seña: $${advance.toInt()}" else "Sin seña",
                        fontSize = 12.sp,
                        color = if (advance > 0) AccentEmerald else TextMuted
                    )
                    Text(
                        text = "Total: $${expected.toInt()} (Resta: $${remaining.toInt()})",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
            }

            HorizontalDivider(color = OutlineVariant.copy(alpha = 0.5f))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Dropdown status
                Box {
                    OutlinedButton(
                        onClick = { expandedMenu = true },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Estado", fontSize = 12.sp, color = TextPrimary)
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextPrimary)
                    }

                    DropdownMenu(
                        expanded = expandedMenu,
                        onDismissRequest = { expandedMenu = false },
                        modifier = Modifier.background(SurfaceDark)
                    ) {
                        listOf(
                            "pending" to "⏳ Pendiente",
                            "arrived" to "📦 Llegó al Taller",
                            "delivered" to "✅ Entregado",
                            "cancelled" to "❌ Cancelado"
                        ).forEach { (key, label) ->
                            DropdownMenuItem(
                                text = { Text(label, color = TextPrimary) },
                                onClick = {
                                    expandedMenu = false
                                    onStatusChange(key)
                                }
                            )
                        }
                    }
                }

                // WhatsApp Button
                Button(
                    onClick = onWhatsAppClick,
                    colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, tint = BackgroundDark, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        if (order.status == "arrived") "Avisar Llegada" else "WhatsApp",
                        color = BackgroundDark,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun NewPartOrderDialog(
    shopId: String,
    repository: SatRepository,
    onDismiss: () -> Unit,
    onOrderCreated: () -> Unit
) {
    var customerName by remember { mutableStateOf("") }
    var customerPhone by remember { mutableStateOf("") }
    var partName by remember { mutableStateOf("") }
    var deviceModel by remember { mutableStateOf("") }
    var advancePayment by remember { mutableStateOf("") }
    var expectedPrice by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceDark,
        title = {
            Text("Encargar Repuesto", fontWeight = FontWeight.Bold, color = TextPrimary)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                errorMessage?.let {
                    Text(it, color = AccentRed, fontSize = 12.sp)
                }

                OutlinedTextField(
                    value = customerName,
                    onValueChange = { customerName = it },
                    label = { Text("Nombre del Cliente *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = customerPhone,
                    onValueChange = { customerPhone = it },
                    label = { Text("Teléfono / WhatsApp *") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = partName,
                    onValueChange = { partName = it },
                    label = { Text("Repuesto Solicitado *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = deviceModel,
                    onValueChange = { deviceModel = it },
                    label = { Text("Modelo de Equipo (Ej: Moto G22)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = advancePayment,
                        onValueChange = { advancePayment = it },
                        label = { Text("Seña ($)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = expectedPrice,
                        onValueChange = { expectedPrice = it },
                        label = { Text("Total ($)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notas / Proveedor") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (customerName.isBlank() || customerPhone.isBlank() || partName.isBlank()) {
                        errorMessage = "Nombre, teléfono y repuesto son obligatorios."
                        return@Button
                    }
                    isSaving = true
                    val partOrder = PartOrder(
                        id = UUID.randomUUID().toString(),
                        shopId = shopId,
                        customerName = customerName.trim(),
                        customerPhone = customerPhone.trim(),
                        partName = partName.trim(),
                        deviceModel = deviceModel.trim(),
                        advancePayment = advancePayment.toDoubleOrNull() ?: 0.0,
                        expectedPrice = expectedPrice.toDoubleOrNull() ?: 0.0,
                        notes = notes.trim(),
                        status = "pending"
                    )
                    coroutineScope.launch {
                        repository.createPartOrder(partOrder).onSuccess {
                            onOrderCreated()
                        }.onFailure { err ->
                            errorMessage = err.message ?: "Error al registrar repuesto."
                            isSaving = false
                        }
                    }
                },
                enabled = !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = OnPrimaryDark, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                } else {
                    Text("Encargar Repuesto", color = OnPrimaryDark, fontWeight = FontWeight.Bold)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = TextSecondary)
            }
        }
    )
}
