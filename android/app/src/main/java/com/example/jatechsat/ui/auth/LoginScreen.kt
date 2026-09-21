package com.example.jatechsat.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.jatechsat.data.model.UserProfile
import com.example.jatechsat.data.supabase.SatRepository
import com.example.jatechsat.data.supabase.SupabaseClientProvider
import com.example.jatechsat.theme.*
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    repository: SatRepository,
    onLoginSuccess: (UserProfile) -> Unit
) {
    val context = LocalContext.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showConfigDialog by remember { mutableStateOf(!SupabaseClientProvider.isConfigured) }

    val coroutineScope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Logo
                Surface(
                    modifier = Modifier.size(64.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = PrimaryCyan.copy(alpha = 0.15f)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Build,
                            contentDescription = "JATECH SAT",
                            tint = PrimaryCyan,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                }

                Text(
                    text = "JATECH SAT",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Text(
                    text = "Gestión Técnica & Pedidos de Taller",
                    fontSize = 13.sp,
                    color = TextSecondary
                )

                // Warning / Config Banner
                if (!SupabaseClientProvider.isConfigured) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showConfigDialog = true },
                        shape = RoundedCornerShape(12.dp),
                        color = AccentAmber.copy(alpha = 0.15f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null, tint = AccentAmber, modifier = Modifier.size(18.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Conexión a Supabase no configurada",
                                    color = AccentAmber,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "Tocá aquí para ingresar la URL y API Key de tu base de datos.",
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                // Error Message
                errorMessage?.let { msg ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = AccentRed.copy(alpha = 0.15f)
                    ) {
                        Text(
                            text = msg,
                            color = AccentRed,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }

                // Email
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; errorMessage = null },
                    label = { Text("Correo Electrónico") },
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = PrimaryCyan) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryCyan,
                        unfocusedBorderColor = OutlineVariant,
                        focusedLabelColor = PrimaryCyan,
                        unfocusedLabelColor = TextSecondary,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                // Password
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; errorMessage = null },
                    label = { Text("Contraseña") },
                    leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = PrimaryCyan) },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = null,
                                tint = TextSecondary
                            )
                        }
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryCyan,
                        unfocusedBorderColor = OutlineVariant,
                        focusedLabelColor = PrimaryCyan,
                        unfocusedLabelColor = TextSecondary,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Submit Button
                Button(
                    onClick = {
                        if (!SupabaseClientProvider.isConfigured) {
                            showConfigDialog = true
                            return@Button
                        }
                        if (email.isBlank() || password.isBlank()) {
                            errorMessage = "Por favor ingresá tu correo y contraseña."
                            return@Button
                        }
                        isLoading = true
                        errorMessage = null
                        coroutineScope.launch {
                            val result = repository.signIn(email, password)
                            isLoading = false
                            result.onSuccess { user ->
                                onLoginSuccess(user)
                            }.onFailure { err ->
                                val msg = err.message ?: "Error al iniciar sesión."
                                if (msg.contains("unable to resolve host", ignoreCase = true) || msg.contains("xyzcompany", ignoreCase = true)) {
                                    errorMessage = "Error de conexión: El host de Supabase no es válido. Configurá tu URL de proyecto."
                                    showConfigDialog = true
                                } else {
                                    errorMessage = msg
                                }
                            }
                        }
                    },
                    enabled = !isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = OnPrimaryDark,
                            modifier = Modifier.size(24.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = "Iniciar Sesión",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = OnPrimaryDark
                        )
                    }
                }

                // Config Server Link
                TextButton(onClick = { showConfigDialog = true }) {
                    Icon(Icons.Default.Settings, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Configurar Servidor Supabase",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                }
            }
        }
    }

    // Modal de Configuración de Servidor Supabase
    if (showConfigDialog) {
        var tempUrl by remember { mutableStateOf(SupabaseClientProvider.currentUrl.takeIf { !it.contains("xyzcompany") } ?: "") }
        var tempKey by remember { mutableStateOf(SupabaseClientProvider.currentKey.takeIf { it != "public-anon-key" } ?: "") }
        var configError by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = {
                if (SupabaseClientProvider.isConfigured) showConfigDialog = false
            },
            containerColor = SurfaceDark,
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Storage, contentDescription = null, tint = PrimaryCyan)
                    Text("Conexión Supabase", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = "Ingresá la URL de tu proyecto Supabase y tu clave anónima (anon public key).",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )

                    configError?.let {
                        Text(it, color = AccentRed, fontSize = 11.sp)
                    }

                    OutlinedTextField(
                        value = tempUrl,
                        onValueChange = { tempUrl = it; configError = null },
                        label = { Text("Project URL (https://xxxx.supabase.co)") },
                        singleLine = true,
                        placeholder = { Text("https://tu-proyecto.supabase.co") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = tempKey,
                        onValueChange = { tempKey = it; configError = null },
                        label = { Text("Anon Public Key (eyJhbGci...)") },
                        singleLine = false,
                        maxLines = 4,
                        placeholder = { Text("Clave pública anónima") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanUrl = tempUrl.trim()
                        val cleanKey = tempKey.trim()

                        if (!cleanUrl.startsWith("https://") || !cleanUrl.contains(".supabase.co")) {
                            configError = "La URL debe comenzar con https:// y pertenecer a supabase.co"
                            return@Button
                        }
                        if (cleanKey.isBlank()) {
                            configError = "La API Key no puede estar vacía."
                            return@Button
                        }

                        SupabaseClientProvider.updateCredentials(context, cleanUrl, cleanKey)
                        showConfigDialog = false
                        errorMessage = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryCyan)
                ) {
                    Text("Guardar y Conectar", color = OnPrimaryDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                if (SupabaseClientProvider.isConfigured) {
                    TextButton(onClick = { showConfigDialog = false }) {
                        Text("Cancelar", color = TextSecondary)
                    }
                }
            }
        )
    }
}
