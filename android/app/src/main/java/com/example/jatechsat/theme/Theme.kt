package com.example.jatechsat.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryCyan,
    onPrimary = OnPrimaryDark,
    primaryContainer = PrimaryCyanVariant,
    secondary = AccentAmber,
    tertiary = AccentViolet,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceContainerHigh,
    outline = OutlineVariant,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary
)

@Composable
fun JatechSATTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
