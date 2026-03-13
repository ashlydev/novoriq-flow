package com.novoriq.flow.android.core.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.novoriq.flow.android.core.model.BusinessProfile
import com.novoriq.flow.android.core.model.FlowUser
import com.novoriq.flow.android.core.model.SessionSnapshot
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.sessionDataStore by preferencesDataStore(name = "flow_session")

class SessionStore(private val context: Context) {
    private object Keys {
        val authenticated = booleanPreferencesKey("authenticated")
        val onboarded = booleanPreferencesKey("onboarded")
        val userName = stringPreferencesKey("user_name")
        val userEmail = stringPreferencesKey("user_email")
        val businessName = stringPreferencesKey("business_name")
        val businessType = stringPreferencesKey("business_type")
        val businessCurrency = stringPreferencesKey("business_currency")
        val businessPhone = stringPreferencesKey("business_phone")
        val businessEmail = stringPreferencesKey("business_email")
    }

    val session: Flow<SessionSnapshot> = context.sessionDataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { preferences ->
            SessionSnapshot(
                isAuthenticated = preferences[Keys.authenticated] ?: false,
                hasCompletedOnboarding = preferences[Keys.onboarded] ?: false,
                user = preferences.toUser(),
                business = preferences.toBusiness()
            )
        }

    suspend fun persistLogin(user: FlowUser) {
        context.sessionDataStore.edit { preferences ->
            preferences[Keys.authenticated] = true
            preferences[Keys.userName] = user.fullName
            preferences[Keys.userEmail] = user.email
        }
    }

    suspend fun persistOnboarding(business: BusinessProfile) {
        context.sessionDataStore.edit { preferences ->
            preferences[Keys.onboarded] = true
            preferences[Keys.businessName] = business.name
            preferences[Keys.businessType] = business.type
            preferences[Keys.businessCurrency] = business.currency
            preferences[Keys.businessPhone] = business.phone
            preferences[Keys.businessEmail] = business.email
        }
    }

    suspend fun clearSession() {
        context.sessionDataStore.edit { preferences ->
            preferences.clear()
        }
    }

    private fun Preferences.toUser(): FlowUser? {
        val email = this[Keys.userEmail] ?: return null
        val name = this[Keys.userName] ?: "Flow User"
        return DemoSeed.defaultUser.copy(fullName = name, email = email)
    }

    private fun Preferences.toBusiness(): BusinessProfile? {
        val name = this[Keys.businessName] ?: return null
        return BusinessProfile(
            name = name,
            type = this[Keys.businessType] ?: DemoSeed.defaultBusiness.type,
            currency = this[Keys.businessCurrency] ?: DemoSeed.defaultBusiness.currency,
            phone = this[Keys.businessPhone] ?: DemoSeed.defaultBusiness.phone,
            email = this[Keys.businessEmail] ?: DemoSeed.defaultBusiness.email
        )
    }
}

