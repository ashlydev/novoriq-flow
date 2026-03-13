package com.novoriq.flow.android.feature.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.novoriq.flow.android.core.common.flowViewModelFactory
import com.novoriq.flow.android.core.data.SessionRepository
import com.novoriq.flow.android.core.designsystem.FlowPrimaryButton
import com.novoriq.flow.android.core.designsystem.FlowSurfaceCard
import com.novoriq.flow.android.core.designsystem.FlowTextField
import com.novoriq.flow.android.core.model.BusinessProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class OnboardingUiState(
    val businessName: String = "Novoriq Flow Demo Business",
    val businessType: String = "Wholesale & Services",
    val currency: String = "USD",
    val phone: String = "+263 77 123 4567",
    val email: String = "ops@novoriq.demo",
    val isSubmitting: Boolean = false
)

class OnboardingViewModel(
    private val sessionRepository: SessionRepository
) : ViewModel() {
    private val mutableState = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = mutableState.asStateFlow()

    fun update(block: OnboardingUiState.() -> OnboardingUiState) {
        mutableState.value = mutableState.value.block()
    }

    fun complete() {
        val current = mutableState.value
        viewModelScope.launch {
            mutableState.value = current.copy(isSubmitting = true)
            sessionRepository.completeOnboarding(
                BusinessProfile(
                    name = current.businessName,
                    type = current.businessType,
                    currency = current.currency,
                    phone = current.phone,
                    email = current.email
                )
            )
            mutableState.value = mutableState.value.copy(isSubmitting = false)
        }
    }
}

@Composable
fun OnboardingRoute(sessionRepository: SessionRepository) {
    val viewModel: OnboardingViewModel = viewModel(
        factory = flowViewModelFactory { OnboardingViewModel(sessionRepository) }
    )
    val state by viewModel.state.collectAsStateWithLifecycle()
    OnboardingScreen(
        state = state,
        onBusinessNameChange = { viewModel.update { copy(businessName = it) } },
        onBusinessTypeChange = { viewModel.update { copy(businessType = it) } },
        onCurrencyChange = { viewModel.update { copy(currency = it) } },
        onPhoneChange = { viewModel.update { copy(phone = it) } },
        onEmailChange = { viewModel.update { copy(email = it) } },
        onComplete = viewModel::complete
    )
}

@Composable
fun OnboardingScreen(
    state: OnboardingUiState,
    onBusinessNameChange: (String) -> Unit,
    onBusinessTypeChange: (String) -> Unit,
    onCurrencyChange: (String) -> Unit,
    onPhoneChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onComplete: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
            .imePadding(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Set up your business", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Keep the Flow product meaning intact: business profile, currency, and core contact details first.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        FlowSurfaceCard {
            FlowTextField(state.businessName, onBusinessNameChange, "Business name")
            FlowTextField(state.businessType, onBusinessTypeChange, "Business type")
            FlowTextField(state.currency, onCurrencyChange, "Currency")
            FlowTextField(state.phone, onPhoneChange, "Business phone")
            FlowTextField(state.email, onEmailChange, "Business email")
            FlowPrimaryButton(
                label = if (state.isSubmitting) "Finishing setup..." else "Complete onboarding",
                onClick = onComplete,
                enabled = !state.isSubmitting,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

