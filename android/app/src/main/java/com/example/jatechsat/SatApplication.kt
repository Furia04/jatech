package com.example.jatechsat

import android.app.Application
import com.example.jatechsat.data.supabase.SupabaseClientProvider

class SatApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        SupabaseClientProvider.initialize(this)
    }
}
