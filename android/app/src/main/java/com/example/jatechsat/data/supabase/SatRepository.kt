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
            val orders = postgrest.from("service_orders")
                .select {
                    filter {
                        eq("shop_id", shopId)
                    }
                    order("created_at", order = Order.DESCENDING)
                }
                .decodeList<ServiceOrder>()
            Result.success(orders)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOrder(order: ServiceOrder): Result<ServiceOrder> = withContext(Dispatchers.IO) {
        try {
            val created = postgrest.from("service_orders")
                .insert(order) {
                    select()
                }
                .decodeSingle<ServiceOrder>()
            Result.success(created)
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
