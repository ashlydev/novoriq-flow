package com.novoriq.flow.android.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val FlowBackground = Color(0xFF0F172A)
val FlowSurface = Color(0xFF1E293B)
val FlowSurfaceVariant = Color(0xFF334155)
val FlowDrawerBackground = Color(0xFF0B1220)
val FlowPrimary = Color(0xFF2563EB)
val FlowPrimaryPressed = Color(0xFF1D4ED8)
val FlowSecondary = Color(0xFF38BDF8)
val FlowSuccess = Color(0xFF16A34A)
val FlowWarning = Color(0xFFF59E0B)
val FlowError = Color(0xFFDC2626)
val FlowInfo = Color(0xFF0EA5E9)
val FlowTextPrimary = Color(0xFFF8FAFC)
val FlowTextSecondary = Color(0xFFCBD5E1)
val FlowTextMuted = Color(0xFF94A3B8)
val FlowBorderSubtle = Color(0x2E94A3B8)
val FlowDivider = Color(0x1F94A3B8)

private val MidnightLedgerScheme: ColorScheme = darkColorScheme(
    primary = FlowPrimary,
    onPrimary = FlowTextPrimary,
    secondary = FlowSecondary,
    background = FlowBackground,
    onBackground = FlowTextPrimary,
    surface = FlowSurface,
    onSurface = FlowTextPrimary,
    surfaceVariant = FlowSurfaceVariant,
    onSurfaceVariant = FlowTextSecondary,
    error = FlowError,
    onError = FlowTextPrimary,
    outline = FlowBorderSubtle
)

private val FlowTypography = Typography(
    displaySmall = TextStyle(fontSize = 36.sp, lineHeight = 40.sp, fontWeight = FontWeight.SemiBold),
    headlineMedium = TextStyle(fontSize = 28.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
    titleLarge = TextStyle(fontSize = 20.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
    titleMedium = TextStyle(fontSize = 16.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 15.sp, lineHeight = 22.sp, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Normal),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 18.sp, fontWeight = FontWeight.Medium),
    labelMedium = TextStyle(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium)
)

private val FlowShapes = Shapes(
    small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(20.dp)
)

@Composable
fun FlowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) MidnightLedgerScheme else MidnightLedgerScheme,
        typography = FlowTypography,
        shapes = FlowShapes,
        content = content
    )
}

