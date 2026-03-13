package com.novoriq.flow.android

import android.app.Application
import com.novoriq.flow.android.core.data.AppContainer
import com.novoriq.flow.android.core.data.DefaultAppContainer

class NovoriqFlowApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer(this)
    }
}

