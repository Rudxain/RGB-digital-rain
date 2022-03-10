# ▶️Demo
![](RGB%20Matrix%20demo.png)

# ℹUsage
* Direct link: https://Rudxain.github.io/RGB-digital-rain

Or...
* How to ⬇️download:
  + For 📱mobile device users: Activate "desktop mode" or "request desktop site" in your browser. GitHub will now show you the "Code🔽" button, click it, then click "Download ZIP".
  + For 🖥desktop/💻laptop PC users: Same as mobile. But no need to use "desktop mode".
  + For users who 📋CP: Create 📄files with the names "index.html", and "anim.js", in whatever directory (📂folder) you want. Select and copy the contents from each of the corresponding files in this repo, then paste those contents in the corresponding files in the directory you have chosen. "favicon.png" is somewhat optional, you can recreate it in MS Paint by creating a 16x16 PNG image.

If you downloaded a ZIP, then extract it. Open `index.html` in your 🌐browser of choice (it also works on Chrome for Android!), and enjoy the real-time animation!

# Naming?
If you don't believe me, the "official" name is ["Digital Rain"](https://en.wikipedia.org/wiki/Matrix_digital_rain), even though the standard-de-facto is "falling code".

# ⭐Credits
1. Original source code by 👤Ganesh Prasad: https://codepen.io/gnsp/pen/vYBQZJm
2. My family member for sending me the article.
3. Inspiration by [RGB PC setups](https://redtech.lk/file/2020/01/Omega_3.png). [This one](https://reddit.com/r/pcmasterrace/comments/rhzb6i/i_built_an_rgb_side_panel_with_the_matrix_digital) looks similar to my animation.

# 📝To-Do (sorted by priority)
1. Use event listener to auto-resize the canvas when the window is resized.
2. Add settings for speed, colors, and charset. Also store them as cookies.
3. Make it interactive.
4. Add a developer/debug mode that "unlocks" constants. I'll implement it by conditionally executing code based on the content of [`location.href`](https://developer.mozilla.org/en-US/docs/Web/API/Location/href).
5. Use `requestAnimationFrame` instead of `setInterval`, for Vsync and energy efficiency.
6. Make the GitHub Pages site use a minified version of the source files.
7. Replace JS by TypeScript in anim.js (convert to anim.ts to take advantage of TS features).
8. Use vector graphics instead of a bitmap.
9. Keep consistent density regardless of display resolution (currently, 4k displays show very small chars, and low-res displays show them big).
