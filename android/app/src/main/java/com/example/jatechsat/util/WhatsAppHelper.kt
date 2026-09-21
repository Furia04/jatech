package com.example.jatechsat.util

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.example.jatechsat.data.model.PartOrder
import com.example.jatechsat.data.model.ServiceOrder
import java.net.URLEncoder

object WhatsAppHelper {

    fun cleanPhone(phone: String): String {
        var clean = phone.replace(Regex("[^0-9]"), "")
        if (clean.length == 10 && !clean.startsWith("54")) {
            clean = "549$clean"
        } else if (clean.length == 8) {
            clean = "54911$clean"
        }
        return clean
    }

    fun openWhatsApp(context: Context, phone: String, message: String) {
        try {
            val formattedPhone = cleanPhone(phone)
            val encodedMessage = URLEncoder.encode(message, "UTF-8")
            val uri = Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone&text=$encodedMessage")
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Fallback to web browser
            try {
                val formattedPhone = cleanPhone(phone)
                val encodedMessage = URLEncoder.encode(message, "UTF-8")
                val uri = Uri.parse("https://wa.me/$formattedPhone?text=$encodedMessage")
                val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } catch (ex: Exception) {
                // Ignore
            }
        }
    }

    fun generatePartArrivedMessage(order: PartOrder, shopName: String): String {
        val customerName = order.customerName
        val partName = order.partName
        val device = if (!order.deviceModel.isNullOrBlank()) " (${order.deviceModel})" else ""
        val expected = order.expectedPrice ?: 0.0
        val advance = order.advancePayment ?: 0.0
        val remaining = (expected - advance).coerceAtLeast(0.0)

        val priceInfo = StringBuilder()
        if (expected > 0) {
            priceInfo.append("💵 *Precio acordado:* $${expected.toInt()}\n")
        }
        if (advance > 0) {
            priceInfo.append("💰 *Seña previa:* $${advance.toInt()}\n")
            priceInfo.append("💳 *Saldo a abonar:* $${remaining.toInt()}\n")
        } else if (expected > 0 && remaining == 0.0) {
            priceInfo.append("✅ *Estado de pago:* Saldado\n")
        }

        return """
            📦 ¡Hola $customerName! Te avisamos desde *$shopName* que ya *LLEGÓ EL REPUESTO* que encargaste:

            🔧 *Repuesto:* $partName$device
            $priceInfo
            📍 ¡Ya podés acercarte al taller para retirarlo o traer tu equipo para la instalación!
            Te esperamos.
        """.trimIndent()
    }

    fun generateOrderReadyMessage(order: ServiceOrder, shopName: String): String {
        val customerName = order.customerName ?: "Estimado/a cliente"
        val deviceInfo = order.deviceInfo ?: "su equipo"
        val code = order.trackingCode
        val finalPrice = order.finalPrice ?: 0.0
        val advance = order.advancePayment ?: 0.0
        val remaining = (finalPrice - advance).coerceAtLeast(0.0)

        return """
            🎉 ¡Hola $customerName! Te avisamos desde *$shopName* que tu *$deviceInfo* (Orden *$code*) ya está *LISTO PARA RETIRAR*.

            💰 *Saldo a abonar:* $${remaining.toInt()}
            
            📄 Podés pasar a retirarlo en nuestros horarios de atención. ¡Te esperamos!
        """.trimIndent()
    }
}
