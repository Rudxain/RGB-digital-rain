# ▶️Demo
![](RGB%20Matrix%20demo.png)

# ℹUsage
* Direct website link: https://Rudxain.github.io/RGB-digital-rain
* [Download](https://github.com/Rudxain/RGB-digital-rain/archive/refs/heads/main.zip) this repo as a .zip file.
If you downloaded the zip, then extract it. Open `index.html` in your 🌐browser of choice (it also works on Chrome for Android!), and enjoy the real-time animation!

# Naming?
If you don't believe me, the "official" name is ["Digital Rain"](https://en.wikipedia.org/wiki/Matrix_digital_rain), even though the standard-de-facto is "falling code".

# ⭐Credits
1. Original source code by 👤Ganesh Prasad: https://codepen.io/gnsp/pen/vYBQZJm
2. My family member for sending me the article.
3. Inspiration by [RGB PC setups](https://redtech.lk/file/2020/01/Omega_3.png). [This one](https://reddit.com/r/pcmasterrace/comments/rhzb6i/i_built_an_rgb_side_panel_with_the_matrix_digital) looks similar to my animation.

# 📝To-Do
* Use event listener to auto-resize the canvas when the window is resized.
* Keep consistent density regardless of display resolution (currently, 4k displays show very small chars, and low-res displays show them big).
* Add settings for speed, colors, and charset. Also store them as cookies.
* Make it interactive.
* Add a developer/debug mode that "unlocks" constants. I'll implement it by conditionally executing code based on the content of [`location.href`](https://developer.mozilla.org/en-US/docs/Web/API/Location/href).
* Use [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) instead of [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/setInterval), for energy efficiency and V-sync.
* Replace JS by TypeScript in anim.js (convert to anim.ts to take advantage of TS features).
* Make the GitHub Pages site use a minified version of the source files.
* Use vector graphics instead of a bitmap
