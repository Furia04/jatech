package com.example.jatechsat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.example.jatechsat.data.model.UserProfile
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.theme.BackgroundDark
import com.example.jatechsat.theme.JatechSATTheme
import com.example.jatechsat.theme.PrimaryCyan
import com.example.jatechsat.ui.auth.LoginScreen
import com.example.jatechsat.ui.dashboard.DashboardScreen
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val repository = SatRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            JatechSATTheme {
                var currentUser by remember { mutableStateOf<UserProfile?>(null) }
                var isCheckingAuth by remember { mutableStateOf(true) }
                val coroutineScope = rememberCoroutineScope()

                LaunchedEffect(Unit) {
                    currentUser = repository.getCurrentUser()
                    isCheckingAuth = false
                }

                if (isCheckingAuth) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(BackgroundDark),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = PrimaryCyan)
                    }
                } else if (currentUser == null) {
                    LoginScreen(
                        repository = repository,
                        onLoginSuccess = { user ->
                            currentUser = user
                        }
                    )
                } else {
                    DashboardScreen(
                        user = currentUser!!,
                        repository = repository,
                        onSignOut = {
                            currentUser = null
                        }
                    )
                }
            }
        }
    }
}
