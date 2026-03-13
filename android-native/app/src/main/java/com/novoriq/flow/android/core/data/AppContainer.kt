package com.novoriq.flow.android.core.data

import android.content.Context
import com.novoriq.flow.android.NovoriqFlowApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

interface AppContainer {
    val sessionRepository: SessionRepository
    val flowRepository: DemoFlowRepository
}

class DefaultAppContainer(context: Context) : AppContainer {
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val sessionStore = SessionStore(context)

    override val flowRepository: DemoFlowRepository = DemoFlowRepository(appScope)
    override val sessionRepository: SessionRepository =
        DemoSessionRepository(sessionStore, appScope, flowRepository)
}

val Context.flowAppContainer: AppContainer
    get() = (applicationContext as NovoriqFlowApplication).container

