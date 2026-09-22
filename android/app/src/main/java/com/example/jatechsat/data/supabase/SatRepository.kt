package com.example.jatechsat.data.supabase

import com.example.jatechsat.data.model.Customer
import com.example.jatechsat.data.model.PartOrder
import com.example.jatechsat.data.model.ServiceOrder
import com.example.jatechsat.data.model.Shop
import com.example.jatechsat.data.model.UserProfile
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

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
            Result.failure(e)
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

    suspend fun createOrder(order: ServiceOrder): Result<ServiceOrder> = withContext(Dispatchers.IO) {
        try {
            val custId = java.util.UUID.randomUUID().toString()
            val devId = java.util.UUID.randomUUID().toString()
            val orderId = if (order.id.isNotBlank()) order.id else java.util.UUID.randomUUID().toString()

            // 1. Insert Customer
            postgrest.from("customers").insert(
                mapOf(
                    "id" to custId,
                    "shop_id" to order.shopId,
                    "full_name" to (order.customerName ?: "Cliente"),
                    "phone" to (order.customerPhone ?: "")
                )
            )

            // 2. Insert Device
            postgrest.from("devices").insert(
                mapOf(
                    "id" to devId,
                    "shop_id" to order.shopId,
                    "customer_id" to custId,
                    "type" to "Equipo",
                    "brand" to (order.deviceInfo ?: "Equipo"),
                    "model" to ""
                )
            )

            // 3. Insert Service Order
            postgrest.from("service_orders").insert(
                mapOf(
                    "id" to orderId,
                    "shop_id" to order.shopId,
                    "tracking_code" to order.trackingCode,
                    "device_id" to devId,
                    "customer_id" to custId,
                    "status" to order.status,
                    "reported_fault" to order.reportedFault,
                    "estimated_cost" to (order.estimatedCost ?: 0.0),
                    "final_price" to (order.finalPrice ?: (order.estimatedCost ?: 0.0)),
                    "advance_payment" to (order.advancePayment ?: 0.0)
                )
            )

            Result.success(order.copy(id = orderId))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateOrderStatus(orderId: String, newStatus: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            postgrest.from("service_orders")
                .update(mapOf("status" to newStatus)) {
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
            postgrest.from("part_orders")
                .update(mapOf("status" to newStatus)) {
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

    // CUSTOMERS
    suspend fun fetchCustomers(shopId: String): Result<List<Customer>> = withContext(Dispatchers.IO) {
        try {
            val customers = postgrest.from("customers")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                }
                .decodeList<Customer>()
            Result.success(customers)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
