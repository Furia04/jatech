package com.example.jatechsat.data.supabase

import android.content.Context
import android.content.SharedPreferences
import com.example.jatechsat.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.realtime
import io.ktor.client.engine.okhttp.OkHttp

object SupabaseClientProvider {
    private var prefs: SharedPreferences? = null
    private var activeClient: SupabaseClient? = null

    fun initialize(context: Context) {
        prefs = context.getSharedPreferences("jatech_sat_config", Context.MODE_PRIVATE)
        createClientInstance()
    }

    val currentUrl: String
        get() {
            val savedUrl = prefs?.getString("supabase_url", null)
            return if (!savedUrl.isNullOrBlank()) savedUrl else BuildConfig.SUPABASE_URL
        }

    val currentKey: String
        get() {
            val savedKey = prefs?.getString("supabase_key", null)
            return if (!savedKey.isNullOrBlank()) savedKey else BuildConfig.SUPABASE_ANON_KEY
        }

    val isConfigured: Boolean
        get() {
            val url = currentUrl
            val key = currentKey
            return url.isNotBlank() &&
                   !url.contains("xyzcompany.supabase.co") &&
                   url.startsWith("https://") &&
                   key.isNotBlank() &&
                   key != "public-anon-key"
        }

    fun updateCredentials(context: Context, url: String, key: String) {
        prefs = context.getSharedPreferences("jatech_sat_config", Context.MODE_PRIVATE)
        prefs?.edit()
            ?.putString("supabase_url", url.trim())
            ?.putString("supabase_key", key.trim())
            ?.apply()
        createClientInstance()
    }

    private fun createClientInstance() {
        val url = currentUrl
        val key = currentKey

        activeClient = createSupabaseClient(
            supabaseUrl = url,
            supabaseKey = key
        ) {
            httpEngine = OkHttp.create()

            install(Auth)
            install(Postgrest)
            install(Storage)
            install(Realtime)
        }
    }

    val client: SupabaseClient
        get() {
            if (activeClient == null) {
                createClientInstance()
            }
            return activeClient!!
        }

    val auth get() = client.auth
    val postgrest get() = client.postgrest
    val storage get() = client.storage
    val realtime get() = client.realtime
}
