package com.example.jatechsat.ui.orders

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import com.example.jatechsat.data.model.Customer
import com.example.jatechsat.data.model.Device
import com.example.jatechsat.data.model.ServiceOrder
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.theme.*
import com.example.jatechsat.util.WhatsAppHelper
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    shopId: String,
    shopName: String,
    canViewMoney: Boolean,
    repository: SatRepository
) {
    var orders by remember { mutableStateOf<List<ServiceOrder>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var showNewDialog by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    val loadOrders = {
        isLoading = true
        coroutineScope.launch {
            repository.fetchOrders(shopId).onSuccess { list ->
                orders = list
            }
            isLoading = false
        }
    }

    LaunchedEffect(shopId) {
        loadOrders()
    }

    val filteredOrders = orders.filter { order ->
        val q = searchQuery.lowercase()
        (order.customerName?.lowercase()?.contains(q) == true) ||
        (order.customerPhone?.lowercase()?.contains(q) == true) ||
        (order.trackingCode.lowercase().contains(q)) ||
        (order.deviceInfo?.lowercase()?.contains(q) == true) ||
        (order.reportedFault.lowercase().contains(q))
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showNewDialog = true },
                containerColor = PrimaryCyan,
                contentColor = OnPrimaryDark,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Nueva Orden")
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
                label = { Text("Buscar orden, cliente o equipo...") },
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
                        Icon(Icons.Default.Build, contentDescription = null, tint = TextMuted, modifier = Modifier.size(48.dp))
                        Text(
                            if (searchQuery.isEmpty()) "No hay órdenes de servicio registradas." else "No se encontraron coincidencias.",
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
                        OrderCard(
                            order = order,
                            canViewMoney = canViewMoney,
                            onStatusChange = { newStatus ->
                                coroutineScope.launch {
                                    repository.updateOrderStatus(order.id, newStatus)
                                    loadOrders()
                                }
                            },
                            onWhatsAppClick = {
                                val msg = WhatsAppHelper.generateOrderReadyMessage(order, shopName)
                                order.customerPhone?.let { phone ->
                                    WhatsAppHelper.openWhatsApp(context, phone, msg)
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    if (showNewDialog) {
        NewOrderDialog(
            shopId = shopId,
            repository = repository,
            onDismiss = { showNewDialog = false },
            onOrderCreated = {
                showNewDialog = false
                loadOrders()
            }
        )
    }
}

@Composable
fun OrderCard(
    order: ServiceOrder,
    canViewMoney: Boolean,
    onStatusChange: (String) -> Unit,
    onWhatsAppClick: () -> Unit
) {
    var expandedMenu by remember { mutableStateOf(false) }

    val statusColor = when (order.status) {
        "recibido" -> PrimaryCyan
        "en_revision" -> AccentViolet
        "esperando_repuesto" -> AccentAmber
        "para_entregar" -> AccentEmerald
        "entregado" -> TextSecondary
        else -> TextMuted
    }

    val statusLabel = when (order.status) {
        "recibido" -> "Recibido"
        "en_revision" -> "En Revisión"
        "esperando_repuesto" -> "Esperando Repuesto"
        "para_entregar" -> "¡Para Entregar!"
        "entregado" -> "Entregado"
        "abandonado" -> "Abandonado"
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
            // Header: Code and Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = order.trackingCode,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = PrimaryCyan
                )

                // Status Badge
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
            }

            // Device info & Customer
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = order.deviceInfo ?: "Equipo sin especificar",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = "Cliente: ${order.customerName ?: "Consumidor Final"} · ${order.customerPhone ?: ""}",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
            }

            // Reported Fault
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = SurfaceContainerHighest,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Falla: ${order.reportedFault}",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    modifier = Modifier.padding(10.dp)
                )
            }

            // Financial summary
            if (canViewMoney) {
                val finalP = order.finalPrice ?: order.estimatedCost ?: 0.0
                val advance = order.advancePayment ?: 0.0
                val remaining = (finalP - advance).coerceAtLeast(0.0)

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
                        text = "Total: $${finalP.toInt()} (Resta: $${remaining.toInt()})",
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
                // Change status dropdown
                Box {
                    OutlinedButton(
                        onClick = { expandedMenu = true },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Cambiar Estado", fontSize = 12.sp, color = TextPrimary)
                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextPrimary)
                    }

                    DropdownMenu(
                        expanded = expandedMenu,
                        onDismissRequest = { expandedMenu = false },
                        modifier = Modifier.background(SurfaceDark)
                    ) {
                        listOf(
                            "recibido" to "Recibido",
                            "en_revision" to "En Revisión",
                            "esperando_repuesto" to "Esperando Repuesto",
                            "para_entregar" to "Para Entregar",
                            "entregado" to "Entregado"
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
                if (!order.customerPhone.isNullOrBlank()) {
                    Button(
                        onClick = onWhatsAppClick,
                        colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Send, contentDescription = null, tint = BackgroundDark, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Avisar", color = BackgroundDark, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun NewOrderDialog(
    shopId: String,
    repository: SatRepository,
    onDismiss: () -> Unit,
    onOrderCreated: () -> Unit
) {
    var isExistingClient by remember { mutableStateOf(false) }
    var existingCustomers by remember { mutableStateOf<List<Customer>>(emptyList()) }
    var customerSearchQuery by remember { mutableStateOf("") }
    var selectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var customerDevices by remember { mutableStateOf<List<Device>>(emptyList()) }
    var selectedDeviceId by remember { mutableStateOf<String?>(null) }

    var customerName by remember { mutableStateOf("") }
    var customerPhone by remember { mutableStateOf("") }
    var deviceInfo by remember { mutableStateOf("") }
    var reportedFault by remember { mutableStateOf("") }
    var advancePayment by remember { mutableStateOf("") }
    var estimatedCost by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(shopId) {
        coroutineScope.launch {
            repository.fetchCustomers(shopId).onSuccess { list ->
                existingCustomers = list
            }
        }
    }

    val filteredCustomers = existingCustomers.filter { c ->
        if (customerSearchQuery.isBlank()) false
        else {
            val q = customerSearchQuery.lowercase()
            c.fullName.lowercase().contains(q) ||
            c.phone.lowercase().contains(q) ||
            (c.documentId?.lowercase()?.contains(q) == true)
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceDark,
        title = {
            Text("Nueva Orden de Trabajo", fontWeight = FontWeight.Bold, color = TextPrimary)
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                errorMessage?.let {
                    Text(it, color = AccentRed, fontSize = 12.sp)
                }

                // Selector Modo Cliente
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BackgroundDark, RoundedCornerShape(8.dp))
                        .padding(2.dp)
                ) {
                    Button(
                        onClick = {
                            isExistingClient = false
                            selectedCustomer = null
                            selectedDeviceId = null
                            customerName = ""
                            customerPhone = ""
                            deviceInfo = ""
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (!isExistingClient) PrimaryCyan else androidx.compose.ui.graphics.Color.Transparent,
                            contentColor = if (!isExistingClient) OnPrimaryDark else TextSecondary
                        ),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Nuevo", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { isExistingClient = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isExistingClient) PrimaryCyan else androidx.compose.ui.graphics.Color.Transparent,
                            contentColor = if (isExistingClient) OnPrimaryDark else TextSecondary
                        ),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Existente", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (isExistingClient) {
                    if (selectedCustomer == null) {
                        OutlinedTextField(
                            value = customerSearchQuery,
                            onValueChange = { customerSearchQuery = it },
                            label = { Text("Buscar cliente por Nombre o DNI...") },
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryCyan) },
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (filteredCustomers.isNotEmpty()) {
                            LazyColumn(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 140.dp)
                                    .background(BackgroundDark, RoundedCornerShape(8.dp))
                            ) {
                                items(filteredCustomers) { cust ->
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                selectedCustomer = cust
                                                customerName = cust.fullName
                                                customerPhone = cust.phone
                                                customerSearchQuery = ""
                                                coroutineScope.launch {
                                                    repository.fetchCustomerDevices(cust.id).onSuccess { devs ->
                                                        customerDevices = devs
                                                        if (devs.isNotEmpty()) {
                                                            selectedDeviceId = devs[0].id
                                                            deviceInfo = "${devs[0].brand} ${devs[0].model}".trim()
                                                        }
                                                    }
                                                }
                                            }
                                            .padding(8.dp)
                                    ) {
                                        Text(cust.fullName, color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text("📞 ${cust.phone}" + if (!cust.documentId.isNullOrBlank()) " · DNI: ${cust.documentId}" else "", color = TextSecondary, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    } else {
                        // Tarjeta de cliente seleccionado
                        Card(
                            colors = CardDefaults.cardColors(containerColor = BackgroundDark),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(selectedCustomer!!.fullName, fontWeight = FontWeight.Bold, color = PrimaryCyan, fontSize = 13.sp)
                                    Text("📞 ${selectedCustomer!!.phone}", color = TextSecondary, fontSize = 11.sp)
                                }
                                IconButton(onClick = {
                                    selectedCustomer = null
                                    selectedDeviceId = null
                                    customerDevices = emptyList()
                                    deviceInfo = ""
                                }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Cambiar", tint = AccentRed)
                                }
                            }
                        }

                        // Selector de dispositivos previos
                        if (customerDevices.isNotEmpty()) {
                            Text("Equipos del cliente:", fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                customerDevices.forEach { dev ->
                                    val isSelected = selectedDeviceId == dev.id
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = {
                                            selectedDeviceId = dev.id
                                            deviceInfo = "${dev.brand} ${dev.model}".trim()
                                        },
                                        label = { Text("${dev.brand} ${dev.model}", fontSize = 11.sp) }
                                    )
                                }
                                FilterChip(
                                    selected = selectedDeviceId == null,
                                    onClick = {
                                        selectedDeviceId = null
                                        deviceInfo = ""
                                    },
                                    label = { Text("+ Otro", fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                } else {
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
                }

                OutlinedTextField(
                    value = deviceInfo,
                    onValueChange = { deviceInfo = it },
                    label = { Text("Equipo (Ej: Moto G22 / HP Pavilion) *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = reportedFault,
                    onValueChange = { reportedFault = it },
                    label = { Text("Falla o Trabajo a Realizar *") },
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
                        value = estimatedCost,
                        onValueChange = { estimatedCost = it },
                        label = { Text("Total ($)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (customerName.isBlank() || customerPhone.isBlank() || deviceInfo.isBlank() || reportedFault.isBlank()) {
                        errorMessage = "Por favor completá los campos obligatorios."
                        return@Button
                    }
                    isSaving = true
                    val code = "#" + (1000..9999).random()
                    val order = ServiceOrder(
                        id = UUID.randomUUID().toString(),
                        shopId = shopId,
                        trackingCode = code,
                        customerName = customerName.trim(),
                        customerPhone = customerPhone.trim(),
                        deviceInfo = deviceInfo.trim(),
                        reportedFault = reportedFault.trim(),
                        advancePayment = advancePayment.toDoubleOrNull() ?: 0.0,
                        estimatedCost = estimatedCost.toDoubleOrNull() ?: 0.0,
                        finalPrice = estimatedCost.toDoubleOrNull() ?: 0.0,
                        status = "recibido"
                    )
                    coroutineScope.launch {
                        repository.createOrder(
                            order = order,
                            existingCustomerId = if (isExistingClient) selectedCustomer?.id else null,
                            existingDeviceId = if (isExistingClient) selectedDeviceId else null
                        ).onSuccess {
                            onOrderCreated()
                        }.onFailure { err ->
                            errorMessage = err.message ?: "Error al guardar orden."
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
                    Text("Ingresar Equipo", color = OnPrimaryDark, fontWeight = FontWeight.Bold)
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
