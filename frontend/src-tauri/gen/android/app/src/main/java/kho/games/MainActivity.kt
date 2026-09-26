package kho.games

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    // Edge-to-edge (forced on Android 15+) draws the WebView under the status and
    // navigation bars, and Android WebView does not reliably report CSS
    // safe-area insets. Pad the content by the system bars / display cutout so
    // the game never sits under them; the padding shows the window background.
    val content = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }
  }
}
