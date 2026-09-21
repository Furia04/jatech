package com.example.jatechsat

import android.app.Application
import com.example.jatechsat.data.supabase.SupabaseClientProvider

class SatApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Supabase Client on application start
        SupabaseClientProvider.client
    }
}
