package com.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// اضافه کردن این import برای اطمینان
import com.facebook.react.ReactPackage 

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      // اصلاح اصلی اینجاست: اضافه کردن .packages
      packageList = PackageList(this).packages 
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}