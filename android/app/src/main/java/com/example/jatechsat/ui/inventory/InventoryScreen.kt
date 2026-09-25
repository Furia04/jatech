package com.example.jatechsat.ui.inventory

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.jatechsat.data.model.InventoryItem
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.theme.*
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    shopId: String,
    canViewMoney: Boolean,
    repository: SatRepository
) {
    var items by remember { mutableStateOf<List<InventoryItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var showDialog by remember { mutableStateOf(false) }
    var itemToEdit by remember { mutableStateOf<InventoryItem?>(null) }
    var itemToDelete by remember { mutableStateOf<InventoryItem?>(null) }
    var filterLowStockOnly by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    val loadItems = {
        isLoading = true
        coroutineScope.launch {
            repository.fetchInventory(shopId).onSuccess { list ->
                items = list
            }
            isLoading = false
        }
    }

    LaunchedEffect(shopId) {
        loadItems()
    }

    val filteredItems = items.filter { item ->
        val q = searchQuery.lowercase()
        val matchesQuery = item.name.lowercase().contains(q) ||
                (item.sku?.lowercase()?.contains(q) == true) ||
                (item.category?.lowercase()?.contains(q) == true) ||
                (item.location?.lowercase()?.contains(q) == true)
        val matchesLowStock = !filterLowStockOnly || (item.stock <= item.minStock)
        matchesQuery && matchesLowStock
    }

    val totalItemsCount = items.size
    val lowStockCount = items.count { it.stock <= it.minStock }
    val totalInventoryValue = items.sumOf { (it.sellingPrice ?: 0.0) * it.stock }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    itemToEdit = null
                    showDialog = true
                },
                containerColor = PrimaryCyan,
                contentColor = OnPrimaryDark,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Nuevo Repuesto")
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
            // Buscador
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Buscar repuesto, SKU o categoría...") },
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

            // Resumen de Métricas
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("TOTAL ÍTEMS", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = TextSecondary)
                        Text("$totalItemsCount", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    }
                }

                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { filterLowStockOnly = !filterLowStockOnly },
                    colors = CardDefaults.cardColors(
                        containerColor = if (filterLowStockOnly) AccentAmber.copy(alpha = 0.2f) else SurfaceDark
                    ),
                    shape = RoundedCornerShape(12.dp),
                    border = if (filterLowStockOnly) androidx.compose.foundation.BorderStroke(1.dp, AccentAmber) else null
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text("STOCK BAJO", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = AccentAmber)
                        Text("$lowStockCount", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = if (lowStockCount > 0) AccentAmber else TextSecondary)
                    }
                }

                if (canViewMoney) {
                    Card(
                        modifier = Modifier.weight(1.2f),
                        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("VALOR STOCK", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = AccentEmerald)
                            Text("$${String.format("%,.0f", totalInventoryValue)}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AccentEmerald)
                        }
                    }
                }
            }

            // Lista de Repuestos
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryCyan)
                }
            } else if (filteredItems.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Inventory2, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(48.dp))
                        Text(
                            text = if (searchQuery.isNotEmpty() || filterLowStockOnly) "No se encontraron repuestos." else "No hay repuestos en el inventario.",
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(filteredItems, key = { it.id }) { item ->
                        InventoryItemCard(
                            item = item,
                            canViewMoney = canViewMoney,
                            onStockChange = { delta ->
                                val newStock = maxOf(0, item.stock + delta)
                                coroutineScope.launch {
                                    repository.updateInventoryStock(item.id, newStock).onSuccess {
                                        items = items.map { if (it.id == item.id) it.copy(stock = newStock) else it }
                                    }
                                }
                            },
                            onEdit = {
                                itemToEdit = item
                                showDialog = true
                            },
                            onDelete = {
                                itemToDelete = item
                            }
                        )
                    }
                }
            }
        }
    }

    // Modal Crear / Editar
    if (showDialog) {
        InventoryItemDialog(
            shopId = shopId,
            item = itemToEdit,
            canViewMoney = canViewMoney,
            repository = repository,
            onDismiss = { showDialog = false },
            onSaved = {
                showDialog = false
                loadItems()
            }
        )
    }

    // Modal Confirmación Eliminar
    itemToDelete?.let { target ->
        AlertDialog(
            onDismissRequest = { itemToDelete = null },
            containerColor = SurfaceDark,
            title = { Text("Eliminar Repuesto", fontWeight = FontWeight.Bold, color = TextPrimary) },
            text = {
                Text(
                    "¿Estás seguro de eliminar '${target.name}' del inventario? Esta acción no se puede deshacer.",
                    color = TextSecondary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            repository.deleteInventoryItem(target.id).onSuccess {
                                items = items.filter { it.id !== target.id }
                                itemToDelete = null
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
                ) {
                    Text("Eliminar", color = TextPrimary, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { itemToDelete = null }) {
                    Text("Cancelar", color = TextSecondary)
                }
            }
        )
    }
}

@Composable
fun InventoryItemCard(
    item: InventoryItem,
    canViewMoney: Boolean,
    onStockChange: (Int) -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val isLowStock = item.stock <= item.minStock
    var menuExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        border = if (isLowStock) androidx.compose.foundation.BorderStroke(1.dp, AccentAmber.copy(alpha = 0.5f)) else null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Fila Superior: Nombre y Menú
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = TextPrimary
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        item.category?.let { cat ->
                            Text(
                                text = cat,
                                fontSize = 11.sp,
                                color = PrimaryCyan,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        if (!item.sku.isNullOrBlank()) {
                            Text("• SKU: ${item.sku}", fontSize = 11.sp, color = TextSecondary)
                        }
                        if (!item.location.isNullOrBlank()) {
                            Text("• 📍 ${item.location}", fontSize = 11.sp, color = TextSecondary)
                        }
                    }
                }

                Box {
                    IconButton(onClick = { menuExpanded = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Opciones", tint = TextSecondary)
                    }
                    DropdownMenu(
                        expanded = menuExpanded,
                        onDismissRequest = { menuExpanded = false },
                        modifier = Modifier.background(SurfaceDark)
                    ) {
                        DropdownMenuItem(
                            text = { Text("Editar", color = TextPrimary) },
                            leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null, tint = PrimaryCyan) },
                            onClick = {
                                menuExpanded = false
                                onEdit()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Eliminar", color = AccentRed) },
                            leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = AccentRed) },
                            onClick = {
                                menuExpanded = false
                                onDelete()
                            }
                        )
                    }
                }
            }

            HorizontalDivider(color = OutlineVariant.copy(alpha = 0.5f))

            // Fila Inferior: Stock Stepper y Precio
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Stock y Stepper
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    IconButton(
                        onClick = { onStockChange(-1) },
                        modifier = Modifier
                            .size(32.dp)
                            .background(BackgroundDark, CircleShape),
                        enabled = item.stock > 0
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Restar", tint = if (item.stock > 0) TextPrimary else TextSecondary, modifier = Modifier.size(16.dp))
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${item.stock}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isLowStock) AccentAmber else AccentEmerald
                        )
                        Text(
                            text = if (isLowStock) "Mín: ${item.minStock}" else "en stock",
                            fontSize = 9.sp,
                            color = if (isLowStock) AccentAmber else TextSecondary
                        )
                    }

                    IconButton(
                        onClick = { onStockChange(1) },
                        modifier = Modifier
                            .size(32.dp)
                            .background(BackgroundDark, CircleShape)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Sumar", tint = PrimaryCyan, modifier = Modifier.size(16.dp))
                    }

                    if (isLowStock) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = AccentAmber.copy(alpha = 0.15f)),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "⚠️ Stock Bajo",
                                color = AccentAmber,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                // Precios
                Column(horizontalAlignment = Alignment.End) {
                    item.sellingPrice?.let { price ->
                        Text(
                            text = "$${String.format("%,.0f", price)}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = AccentEmerald
                        )
                    }
                    if (canViewMoney && item.costPrice != null) {
                        Text(
                            text = "Costo: $${String.format("%,.0f", item.costPrice)}",
                            fontSize = 10.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InventoryItemDialog(
    shopId: String,
    item: InventoryItem?,
    canViewMoney: Boolean,
    repository: SatRepository,
    onDismiss: () -> Unit,
    onSaved: () -> Unit
) {
    var name by remember { mutableStateOf(item?.name ?: "") }
    var sku by remember { mutableStateOf(item?.sku ?: "") }
    var category by remember { mutableStateOf(item?.category ?: "") }
    var location by remember { mutableStateOf(item?.location ?: "") }
    var stock by remember { mutableStateOf(item?.stock?.toString() ?: "1") }
    var minStock by remember { mutableStateOf(item?.minStock?.toString() ?: "2") }
    var costPrice by remember { mutableStateOf(item?.costPrice?.toString() ?: "") }
    var sellingPrice by remember { mutableStateOf(item?.sellingPrice?.toString() ?: "") }

    var isSaving by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    val isEditing = item != null

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = SurfaceDark,
        title = {
            Text(
                text = if (isEditing) "Editar Repuesto" else "Nuevo Repuesto",
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
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
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre del Repuesto / Producto *") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        label = { Text("Categoría (ej: Pantallas)") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sku,
                        onValueChange = { sku = it },
                        label = { Text("SKU / Código") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = stock,
                        onValueChange = { stock = it },
                        label = { Text("Stock Actual *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = minStock,
                        onValueChange = { minStock = it },
                        label = { Text("Stock Mínimo") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (canViewMoney) {
                        OutlinedTextField(
                            value = costPrice,
                            onValueChange = { costPrice = it },
                            label = { Text("Costo ($)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    OutlinedTextField(
                        value = sellingPrice,
                        onValueChange = { sellingPrice = it },
                        label = { Text("Precio Venta ($)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = location,
                    onValueChange = { location = it },
                    label = { Text("Ubicación Física (ej: Estante A, Cajón 3)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank()) {
                        errorMessage = "El nombre del repuesto es obligatorio."
                        return@Button
                    }
                    isSaving = true
                    val targetItem = InventoryItem(
                        id = item?.id ?: UUID.randomUUID().toString(),
                        shopId = shopId,
                        name = name.trim(),
                        sku = sku.trim().ifBlank { null },
                        category = category.trim().ifBlank { null },
                        location = location.trim().ifBlank { null },
                        stock = stock.toIntOrNull() ?: 0,
                        minStock = minStock.toIntOrNull() ?: 2,
                        costPrice = costPrice.toDoubleOrNull(),
                        sellingPrice = sellingPrice.toDoubleOrNull()
                    )

                    coroutineScope.launch {
                        val result = if (isEditing) {
                            repository.updateInventoryItem(targetItem)
                        } else {
                            repository.createInventoryItem(targetItem).map { }
                        }

                        result.onSuccess {
                            onSaved()
                        }.onFailure { err ->
                            errorMessage = err.message ?: "Error al guardar repuesto."
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
                    Text(if (isEditing) "Actualizar" else "Guardar", color = OnPrimaryDark, fontWeight = FontWeight.Bold)
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
