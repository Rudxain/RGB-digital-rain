'use strict';
const canv = document.getElementById('c'),
	ctx = canv.getContext('2d', {alpha: false, desynchronized: true}),
	//primary and secondary colors
	colors = ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],
	//I'm not using `Intl.Segmenter` because grapheme clusters can be rendered with ANY size
	//supporting code-points instead of code-units is easier and less buggy
	charset = [...'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	colTracer = [], //to remember altitude of last drawn char, for each char of every column
	Hz_to_ms = f => 1000 / f,
	randRange = (min, max) => Math.random() * (max - min) + +min, //[min, max)
	clamp = (x, min, max) => x > max ? max : x < min ? min : x //[min, max]

let resizeDelay = 1500,//ms
	zoom = 32, //px
	speed = 30, //Hz of new chars drawn, no-op for dimming
	dimDepth = 32 / 64, //dimming intensity
	minCol = 6, maxCol = 14,
	w, h,
	color_i = 0,
	t, playing,
	itID, tmID

const resize = () => {
	w = canv.width = document.body.offsetWidth
	h = canv.height = document.body.offsetHeight
	//calculate how many columns in the grid are needed to fill the whole canvas
	const colCount = Math.ceil(w / zoom)
	//initialize new tracking slots
	while (colCount > colTracer.length) colTracer.push(0)
	colTracer.length = colCount //shrink and deallocate if necessary
}
const drawChars = () => {
	ctx.fillStyle = '#' + colors[color_i++]
	ctx.font = `bold ${zoom}px monospace`
	color_i %= colors.length
	for (let i = 0, x = 0; i < colTracer.length; i++, x += zoom) {
		const y = colTracer[i]
		//render a codepoint
		ctx.fillText(charset[randRange(0, charset.length) | 0], x, y)
		//since the range is arbitrary, we have freedom to use powers of 2 for performance
		colTracer[i] = y > (randRange(1 << minCol, 1 << maxCol) >>> 0) ? 0 : y + zoom
		/*
		if the canvas shrinks immediately before this,
		then this could cause a non-critical memory leak, and a "CPU leak"
		it's easily fixed by resizing again, or reloading
		*/
	}
}
//fade out trails
const doGlobalDimming = now => {
	if (!playing) return
	const delta = now - t, dim = Math.round(clamp(delta * dimDepth, 0, 0xff))
	//performance
	if (dim){
		ctx.fillStyle = '#000000' + dim.toString(0x10).padStart(2, '0')
		ctx.fillRect(0, 0, w, h)
		//and ensure hi-FPS don't cause dim to get stuck as a no-op
		t = now
	}
	requestAnimationFrame(doGlobalDimming)
}
//the interval ensures `drawChars` is independent of FPS
const togglePlay = () => {
	(playing = !playing)
	? ( itID = setInterval(drawChars, Hz_to_ms(speed)),
		requestAnimationFrame(doGlobalDimming) )
	: clearInterval(itID)
}

resize() //not part of anim, and has some latency, so no RAF
requestAnimationFrame(now => {drawChars(); t = now}) //minimal latency
togglePlay()

//debounced
addEventListener('resize', () => {clearTimeout(tmID); tmID = setTimeout(resize, resizeDelay)})