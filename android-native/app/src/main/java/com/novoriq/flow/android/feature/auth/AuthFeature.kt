package com.novoriq.flow.android.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.SessionRepository
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSecondaryButton
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.designsystem.FlowTextMuted
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

data class AuthUiState(
    val email: String = "owner@novoriq.demo",
    val password: String = "demo1234",
    val isSubmitting: Boolean = false,
    val error: String? = null
)

class AuthViewModel(
    private val sessionRepository: SessionRepository
) : ViewModel() {
    private val mutableState = MutableStateFlow(AuthUiState())
    val state: StateFlow<AuthUiState> = mutableState.asStateFlow()

    fun updateEmail(value: String) {
        mutableState.value = mutableState.value.copy(email = value, error = null)
    }

    fun updatePassword(value: String) {
        mutableState.value = mutableState.value.copy(password = value, error = null)
    }

    fun signIn() {
        val current = mutableState.value
        if (current.isSubmitting) return

        viewModelScope.launch {
            mutableState.value = current.copy(isSubmitting = true, error = null)
            val result = sessionRepository.signIn(current.email, current.password)
            mutableState.value = mutableState.value.copy(
                isSubmitting = false,
                error = result.exceptionOrNull()?.message
            )
        }
    }
}

@Composable
fun AuthRoute(
    sessionRepository: SessionRepository
) {
    val viewModel: AuthViewModel = viewModel(
        factory = flowViewModelFactory { AuthViewModel(sessionRepository) }
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    AuthScreen(
        state = state,
        onEmailChange = viewModel::updateEmail,
        onPasswordChange = viewModel::updatePassword,
        onSubmit = viewModel::signIn
    )
}

@Composable
fun AuthScreen(
    state: AuthUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSubmit: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .imePadding(),
        contentAlignment = Alignment.Center
    ) {
        FlowSurfaceCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Novoriq Flow", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Midnight Ledger Android V1. Sign in to run daily business operations from a native client.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = FlowTextMuted
                )
            }

            FlowTextField(
                value = state.email,
                onValueChange = onEmailChange,
                label = "Email",
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                )
            )
            FlowTextField(
                value = state.password,
                onValueChange = onPasswordChange,
                label = "Password",
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done
                ),
                visualTransformation = PasswordVisualTransformation()
            )
            if (state.error != null) {
                Text(state.error, color = MaterialTheme.colorScheme.error)
            }
            FlowPrimaryButton(
                label = if (state.isSubmitting) "Signing in..." else "Sign in",
                onClick = onSubmit,
                enabled = !state.isSubmitting,
                modifier = Modifier.fillMaxWidth()
            )
            FlowSecondaryButton(
                label = "Use demo credentials",
                onClick = onSubmit,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
