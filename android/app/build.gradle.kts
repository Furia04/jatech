import java.util.Properties
import java.io.FileInputStream

plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.compose.compiler)
  alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.example.jatechsat"
    compileSdk = 36
    val localProperties = Properties()
    val localPropertiesFile = rootProject.file("local.properties")
    if (localPropertiesFile.exists()) {
        localProperties.load(FileInputStream(localPropertiesFile))
    }

    val supabaseUrl = (localProperties.getProperty("SUPABASE_URL")
        ?: project.findProperty("SUPABASE_URL") as? String
        ?: System.getenv("NEXT_PUBLIC_SUPABASE_URL")
        ?: "https://aswlxydrohyayweuhohp.supabase.co")

    val supabaseAnonKey = (localProperties.getProperty("SUPABASE_ANON_KEY")
        ?: project.findProperty("SUPABASE_ANON_KEY") as? String
        ?: System.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        ?: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2x4eWRyb2h5YXl3ZXVob2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mzk2MjksImV4cCI6MjEwMzQxNTYyOX0.BXT23ax2SAj-Sa-bD-kajNIxXkNb_Z13gRiHqXuXsfg")

    defaultConfig {
        applicationId = "com.example.jatechsat"
        minSdk = 29
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$supabaseAnonKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
      compose = true
      aidl = false
      buildConfig = true
      shaders = false
    }

    packaging {
      resources {
        excludes += "/META-INF/{AL2.0,LGPL2.1}"
        excludes += "/META-INF/INDEX.LIST"
        excludes += "/META-INF/io.netty.versions.properties"
      }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
  val composeBom = platform(libs.androidx.compose.bom)
  implementation(composeBom)
  androidTestImplementation(composeBom)

  // Core Android dependencies
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.activity.compose)

  // Arch Components
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.viewmodel.compose)

  // Compose UI & Material 3
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.material.icons)

  // Supabase Kotlin Multiplatform SDK
  val supabaseBom = platform(libs.supabase.bom)
  implementation(supabaseBom)
  implementation(libs.supabase.postgrest)
  implementation(libs.supabase.auth)
  implementation(libs.supabase.storage)
  implementation(libs.supabase.realtime)

  // Ktor Client Engine
  implementation(libs.ktor.client.okhttp)
  implementation(libs.ktor.client.core)

  // Kotlinx Coroutines & Serialization
  implementation(libs.kotlinx.serialization.json)
  implementation(libs.kotlinx.coroutines.android)

  // CameraX & ML Kit
  implementation(libs.androidx.camera.core)
  implementation(libs.androidx.camera.camera2)
  implementation(libs.androidx.camera.lifecycle)
  implementation(libs.androidx.camera.view)
  implementation(libs.mlkit.barcode.scanning)

  // Tooling
  debugImplementation(libs.androidx.compose.ui.tooling)
  debugImplementation(libs.androidx.compose.ui.test.manifest)

  // Navigation
  implementation(libs.androidx.navigation3.ui)
  implementation(libs.androidx.navigation3.runtime)
  implementation(libs.androidx.lifecycle.viewmodel.navigation3)

  // Local tests
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)

  // Instrumented tests
  androidTestImplementation(libs.androidx.test.core)
  androidTestImplementation(libs.androidx.test.ext.junit)
  androidTestImplementation(libs.androidx.test.runner)
  androidTestImplementation(libs.androidx.test.espresso.core)
}
