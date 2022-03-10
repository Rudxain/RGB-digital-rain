# ▶️Demo
![](RGB%20Matrix%20demo.png)

# ℹUsage
* Direct link: https://rudxain.github.io/RGB-digital-rain

Or...
* How to ⬇️download:
  + For 📱mobile device users: Activate "desktop mode" or "request desktop site" in your browser. GitHub will now show you the "Code🔽" button, click it, then click "Download ZIP".
  + For 🖥desktop/💻laptop PC users: Same as mobile. But no need to use "desktop mode".
  + For users who 📋CP: Create 📄files with the names "index.html", and "anim.js", in whatever directory (📂folder) you want. Select and copy the contents from each of the corresponding files in this repo, then paste those contents in the corresponding files in the directory you have chosen. "favicon.png" is somewhat optional, you can recreate it in MS Paint by creating a 16x16 PNG image.

If you downloaded a ZIP, then extract it. Open `index.html` in your 🌐browser of choice (it also works on Chrome for Android!), and enjoy the real-time animation!

# ⭐Credits
Original source code by 👤Ganesh Prasad: https://codepen.io/gnsp/pen/vYBQZJm

# 📝To-Do:
* Use event listener to auto-resize the canvas when the window is resized.
* Add settings for speed, colors, and charset. Also store them as cookies.
* Make it interactive.
* Add a developer/debug mode that "unlocks" constants. I'll implement it by conditionally executing code based on the content of `location.href`.
* Use `requestAnimationFrame` instead of `setInterval`, for Vsync and energy efficiency.
* Make the GitHub Pages site use a minified version of the source files.
* Replace JS by TypeScript in anim.js (convert to anim.ts to take advantage of TS features).
* Use vector graphics instead of a bitmap.
* Keep consistent density regardless of display resolution (currently, 4k displays show very small chars, and low-res displays show them big).
