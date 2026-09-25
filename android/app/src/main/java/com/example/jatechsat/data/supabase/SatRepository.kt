package com.example.jatechsat.data.supabase

import com.example.jatechsat.data.model.Customer
import com.example.jatechsat.data.model.InventoryItem
import com.example.jatechsat.data.model.PartOrder
import com.example.jatechsat.data.model.ServiceOrder
import com.example.jatechsat.data.model.Shop
import com.example.jatechsat.data.model.UserProfile
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class SatRepository {
    private val client = SupabaseClientProvider.client
    private val auth = SupabaseClientProvider.auth
    private val postgrest = SupabaseClientProvider.postgrest
    private val storage = SupabaseClientProvider.storage

    // AUTH
    suspend fun signIn(emailInput: String, passwordInput: String): Result<UserProfile> = withContext(Dispatchers.IO) {
        try {
            auth.signInWith(Email) {
                email = emailInput.trim()
                password = passwordInput
            }
            val user = auth.currentUserOrNull() ?: throw Exception("No se pudo obtener el usuario autenticado.")
            val profile = fetchUserProfile(user.id).getOrNull() ?: UserProfile(
                id = user.id,
                email = user.email ?: emailInput,
                role = "owner",
                shopId = user.id,
                fullName = user.email
            )
            Result.success(profile)
        } catch (e: Exception) {
            val rawMsg = e.message ?: ""
            val userFriendlyMessage = when {
                rawMsg.contains("invalid_credentials", ignoreCase = true) ||
                rawMsg.contains("invalid login", ignoreCase = true) ||
                rawMsg.contains("invalid grant", ignoreCase = true) ||
                rawMsg.contains("email not confirmed", ignoreCase = true) ||
                rawMsg.contains("User not found", ignoreCase = true) ||
                rawMsg.contains("400", ignoreCase = true) ||
                rawMsg.contains("401", ignoreCase = true) -> {
                    "Credenciales inválidas. Por favor revisá tu correo y contraseña."
                }
                rawMsg.contains("unable to resolve host", ignoreCase = true) ||
                rawMsg.contains("connect", ignoreCase = true) ||
                rawMsg.contains("timeout", ignoreCase = true) -> {
                    "No se pudo conectar al servidor. Verificá tu conexión a internet."
                }
                else -> rawMsg.ifBlank { "Credenciales inválidas o error de autenticación." }
            }
            Result.failure(Exception(userFriendlyMessage, e))
        }
    }

    suspend fun signOut() = withContext(Dispatchers.IO) {
        try {
            auth.signOut()
        } catch (e: Exception) {
            // ignore
        }
    }

    suspend fun getCurrentUser(): UserProfile? = withContext(Dispatchers.IO) {
        try {
            val user = auth.currentUserOrNull() ?: return@withContext null
            fetchUserProfile(user.id).getOrNull()
        } catch (e: Exception) {
            null
        }
    }

    private suspend fun fetchUserProfile(userId: String): Result<UserProfile> = withContext(Dispatchers.IO) {
        try {
            val profile = postgrest.from("users")
                .select {
                    filter {
                        eq("id", userId)
                    }
                }
                .decodeSingle<UserProfile>()
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // SHOP
    suspend fun fetchCurrentShop(shopId: String): Result<Shop> = withContext(Dispatchers.IO) {
        try {
            val shop = postgrest.from("shops")
                .select {
                    filter {
                        eq("id", shopId)
                    }
                }
                .decodeSingle<Shop>()
            Result.success(shop)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // SERVICE ORDERS
    suspend fun fetchOrders(shopId: String): Result<List<ServiceOrder>> = withContext(Dispatchers.IO) {
        try {
            val rawOrders = postgrest.from("service_orders")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                    order("created_at", order = Order.DESCENDING)
                }
                .decodeList<kotlinx.serialization.json.JsonObject>()

            val custIds = rawOrders.mapNotNull { it["customer_id"]?.toString()?.trim('"') }.distinct()
            val devIds = rawOrders.mapNotNull { it["device_id"]?.toString()?.trim('"') }.distinct()

            val custMap = mutableMapOf<String, Customer>()
            if (custIds.isNotEmpty()) {
                try {
                    val customers = postgrest.from("customers").select {
                        filter {
                            isIn("id", custIds)
                        }
                    }.decodeList<Customer>()
                    customers.forEach { custMap[it.id] = it }
                } catch (_: Exception) {}
            }

            val devMap = mutableMapOf<String, String>()
            if (devIds.isNotEmpty()) {
                try {
                    val devices = postgrest.from("devices").select {
                        filter {
                            isIn("id", devIds)
                        }
                    }.decodeList<kotlinx.serialization.json.JsonObject>()
                    devices.forEach { d ->
                        val id = d["id"]?.toString()?.trim('"') ?: ""
                        val type = d["type"]?.toString()?.trim('"') ?: ""
                        val brand = d["brand"]?.toString()?.trim('"') ?: ""
                        val model = d["model"]?.toString()?.trim('"') ?: ""
                        devMap[id] = "$type $brand $model".trim()
                    }
                } catch (_: Exception) {}
            }

            val orders = rawOrders.map { ord ->
                val ordId = ord["id"]?.toString()?.trim('"') ?: ""
                val cId = ord["customer_id"]?.toString()?.trim('"') ?: ""
                val dId = ord["device_id"]?.toString()?.trim('"') ?: ""
                val trackingCode = ord["tracking_code"]?.toString()?.trim('"') ?: ""
                val status = ord["status"]?.toString()?.trim('"') ?: "recibido"
                val reportedFault = ord["reported_fault"]?.toString()?.trim('"') ?: ""
                val techDiag = ord["technical_diagnosis"]?.toString()?.trim('"')
                val estCost = ord["estimated_cost"]?.toString()?.toDoubleOrNull()
                val finalPr = ord["final_price"]?.toString()?.toDoubleOrNull()
                val advPay = ord["advance_payment"]?.toString()?.toDoubleOrNull()
                val createdAt = ord["created_at"]?.toString()?.trim('"')

                val cust = custMap[cId]
                val dev = devMap[dId]

                ServiceOrder(
                    id = ordId,
                    shopId = shopId,
                    trackingCode = trackingCode,
                    status = status,
                    reportedFault = reportedFault,
                    technicalDiagnosis = techDiag,
                    estimatedCost = estCost,
                    finalPrice = finalPr,
                    advancePayment = advPay,
                    customerName = cust?.fullName ?: "Cliente",
                    customerPhone = cust?.phone ?: "",
                    deviceInfo = dev ?: "Equipo",
                    createdAt = createdAt
                )
            }

            Result.success(orders)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchCustomers(shopId: String): Result<List<Customer>> = withContext(Dispatchers.IO) {
        try {
            val list = postgrest.from("customers")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                    order("full_name", order = Order.ASCENDING)
                }
                .decodeList<Customer>()
            Result.success(list)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchCustomerDevices(customerId: String): Result<List<com.example.jatechsat.data.model.Device>> = withContext(Dispatchers.IO) {
        try {
            val raw = postgrest.from("devices")
                .select {
                    filter {
                        eq("customer_id", customerId)
                    }
                    order("created_at", order = Order.DESCENDING)
                }
                .decodeList<kotlinx.serialization.json.JsonObject>()

            val devs = raw.map { d ->
                val id = d["id"]?.toString()?.trim('"') ?: ""
                val shopId = d["shop_id"]?.toString()?.trim('"') ?: ""
                val custId = d["customer_id"]?.toString()?.trim('"') ?: ""
                val type = d["type"]?.toString()?.trim('"') ?: "Equipo"
                val brand = d["brand"]?.toString()?.trim('"') ?: ""
                val model = d["model"]?.toString()?.trim('"') ?: ""
                val serial = d["serial_number"]?.toString()?.trim('"')
                com.example.jatechsat.data.model.Device(
                    id = id,
                    shopId = shopId,
                    customerId = custId,
                    type = type,
                    brand = brand,
                    model = model,
                    serialNumber = serial
                )
            }
            Result.success(devs)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOrder(
        order: ServiceOrder,
        existingCustomerId: String? = null,
        existingDeviceId: String? = null
    ): Result<ServiceOrder> = withContext(Dispatchers.IO) {
        try {
            val custId = if (!existingCustomerId.isNullOrBlank()) existingCustomerId else java.util.UUID.randomUUID().toString()
            if (existingCustomerId.isNullOrBlank()) {
                val custPayload = buildJsonObject {
                    put("id", custId)
                    put("shop_id", order.shopId)
                    put("full_name", order.customerName ?: "Cliente")
                    put("phone", order.customerPhone ?: "")
                }
                postgrest.from("customers").insert(custPayload)
            }

            val devId = if (!existingDeviceId.isNullOrBlank()) existingDeviceId else java.util.UUID.randomUUID().toString()
            if (existingDeviceId.isNullOrBlank()) {
                val devPayload = buildJsonObject {
                    put("id", devId)
                    put("shop_id", order.shopId)
                    put("customer_id", custId)
                    put("type", "Equipo")
                    put("brand", order.deviceInfo ?: "Equipo")
                    put("model", "")
                }
                postgrest.from("devices").insert(devPayload)
            }

            val orderId = if (order.id.isNotBlank()) order.id else java.util.UUID.randomUUID().toString()
            val orderJson = buildJsonObject {
                put("id", orderId)
                put("shop_id", order.shopId)
                put("tracking_code", order.trackingCode)
                put("device_id", devId)
                put("customer_id", custId)
                put("status", order.status)
                put("reported_fault", order.reportedFault)
                put("estimated_cost", order.estimatedCost ?: 0.0)
                put("final_price", order.finalPrice ?: (order.estimatedCost ?: 0.0))
                put("advance_payment", order.advancePayment ?: 0.0)
            }

            try {
                postgrest.from("service_orders").insert(orderJson)
            } catch (ordEx: Exception) {
                if (ordEx.message?.contains("order_status", ignoreCase = true) == true || ordEx.message?.contains("enum", ignoreCase = true) == true) {
                    val fallbackJson = buildJsonObject {
                        put("id", orderId)
                        put("shop_id", order.shopId)
                        put("tracking_code", order.trackingCode)
                        put("device_id", devId)
                        put("customer_id", custId)
                        put("reported_fault", order.reportedFault)
                        put("estimated_cost", order.estimatedCost ?: 0.0)
                        put("final_price", order.finalPrice ?: (order.estimatedCost ?: 0.0))
                        put("advance_payment", order.advancePayment ?: 0.0)
                    }
                    postgrest.from("service_orders").insert(fallbackJson)
                } else {
                    throw ordEx
                }
            }

            Result.success(order.copy(id = orderId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateOrderStatus(orderId: String, newStatus: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val updatePayload = buildJsonObject {
                put("status", newStatus)
            }
            postgrest.from("service_orders")
                .update(updatePayload) {
                    filter {
                        eq("id", orderId)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // PART ORDERS
    suspend fun fetchPartOrders(shopId: String): Result<List<PartOrder>> = withContext(Dispatchers.IO) {
        try {
            val partOrders = postgrest.from("part_orders")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                    order("created_at", order = Order.DESCENDING)
                }
                .decodeList<PartOrder>()
            Result.success(partOrders)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createPartOrder(order: PartOrder): Result<PartOrder> = withContext(Dispatchers.IO) {
        try {
            val created = postgrest.from("part_orders")
                .insert(order) {
                    select()
                }
                .decodeSingle<PartOrder>()
            Result.success(created)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePartOrderStatus(orderId: String, newStatus: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val payload = buildJsonObject {
                put("status", newStatus)
            }
            postgrest.from("part_orders")
                .update(payload) {
                    filter {
                        eq("id", orderId)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePartOrder(orderId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            postgrest.from("part_orders")
                .delete {
                    filter {
                        eq("id", orderId)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }


    // INVENTORY
    suspend fun fetchInventory(shopId: String): Result<List<InventoryItem>> = withContext(Dispatchers.IO) {
        try {
            val items = postgrest.from("inventory")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                    order("name", order = Order.ASCENDING)
                }
                .decodeList<InventoryItem>()
            Result.success(items)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createInventoryItem(item: InventoryItem): Result<InventoryItem> = withContext(Dispatchers.IO) {
        try {
            val created = postgrest.from("inventory")
                .insert(item) {
                    select()
                }
                .decodeSingle<InventoryItem>()
            Result.success(created)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateInventoryItem(item: InventoryItem): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            postgrest.from("inventory")
                .update(item) {
                    filter {
                        eq("id", item.id)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateInventoryStock(itemId: String, newStock: Int): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val payload = buildJsonObject {
                put("stock", newStock)
            }
            postgrest.from("inventory")
                .update(payload) {
                    filter {
                        eq("id", itemId)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteInventoryItem(itemId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            postgrest.from("inventory")
                .delete {
                    filter {
                        eq("id", itemId)
                    }
                }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
