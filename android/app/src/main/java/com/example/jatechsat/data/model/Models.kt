package com.example.jatechsat.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    @SerialName("full_name") val fullName: String? = null,
    val role: String = "technician", // owner, technician, superadmin
    @SerialName("shop_id") val shopId: String? = null,
    @SerialName("can_view_financials") val canViewFinancials: Boolean = true
)

@Serializable
data class Shop(
    val id: String,
    val name: String = "Mi Taller",
    @SerialName("owner_email") val ownerEmail: String = "",
    @SerialName("subscription_status") val subscriptionStatus: String = "active"
)

@Serializable
data class ServiceOrder(
    val id: String,
    @SerialName("shop_id") val shopId: String,
    @SerialName("tracking_code") val trackingCode: String,
    val status: String = "recibido", // recibido, en_revision, esperando_repuesto, para_entregar, entregado, abandonado
    @SerialName("reported_fault") val reportedFault: String,
    @SerialName("technical_diagnosis") val technicalDiagnosis: String? = null,
    @SerialName("estimated_cost") val estimatedCost: Double? = null,
    @SerialName("final_price") val finalPrice: Double? = null,
    @SerialName("advance_payment") val advancePayment: Double? = null,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    @SerialName("device_info") val deviceInfo: String? = null,
    @SerialName("device_photos") val devicePhotos: List<String>? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class PartOrder(
    val id: String,
    @SerialName("shop_id") val shopId: String,
    @SerialName("customer_name") val customerName: String,
    @SerialName("customer_phone") val customerPhone: String,
    @SerialName("part_name") val partName: String,
    @SerialName("device_model") val deviceModel: String? = null,
    @SerialName("advance_payment") val advancePayment: Double? = 0.0,
    @SerialName("expected_price") val expectedPrice: Double? = 0.0,
    val status: String = "pending", // pending, arrived, delivered, cancelled
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Customer(
    val id: String,
    @SerialName("shop_id") val shopId: String,
    @SerialName("full_name") val fullName: String,
    val phone: String,
    @SerialName("document_id") val documentId: String? = null,
    val email: String? = null
)

@Serializable
data class Device(
    val id: String,
    @SerialName("shop_id") val shopId: String,
    @SerialName("customer_id") val customerId: String,
    val type: String = "Equipo",
    val brand: String = "",
    val model: String = "",
    @SerialName("serial_number") val serialNumber: String? = null
)

@Serializable
data class InventoryItem(
    val id: String,
    @SerialName("shop_id") val shopId: String,
    val name: String,
    val sku: String? = null,
    val stock: Int = 0,
    @SerialName("min_stock") val minStock: Int = 0,
    @SerialName("cost_price") val costPrice: Double? = null,
    @SerialName("selling_price") val sellingPrice: Double? = null,
    val category: String? = null,
    val location: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)
