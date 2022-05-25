'use strict';
//setup and initialization
const canv = document.getElementById('c'),
	ctx = canv.getContext('2d', {alpha: false, desynchronized: true}),
	//primary and secondary colors
	colors = ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],
	//I'm not using `Intl.Segmenter` because grapheme clusters can be rendered with ANY size
	//supporting code-points instead of code-units is easier and less buggy
	charset = [...'!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	Hz_to_ms = f => 1000 / f,
	randRange = (min, max) => Math.random() * (max - min) + +min, //[min, max)
	clamp = (x, min, max) => x > max ? max : x < min ? min : x //[min, max]

let debounceDelay = 1500,//ms
	space = 24, //px between chars, kinda works like "zoom"
	speed = 30, //Hz of new chars drawn
	dimDepth = 1 / 3,
	minCol = 7, maxCol = 14,
	w = canv.width = document.body.offsetWidth,
	h = canv.height = document.body.offsetHeight,
	color_i = 0, t

const columns = Array(Math.ceil(w / space)).fill(0)

const drawChars = () => {
	ctx.fillStyle = '#' + colors[color_i++]
	ctx.font = space + 'px monospace'
	color_i %= colors.length
	for (let i = 0, x = 0; i < columns.length; i++, x += space) {
		const y = columns[i]
		//render a codepoint
		ctx.fillText(charset[randRange(0, charset.length) | 0], x, y)
		//since the range is arbitrary, we have freedom to use powers of 2 for performance
		columns[i] = y > (randRange(1 << minCol, 1 << maxCol) >>> 0) ? 0 : y + space
		//if the canvas shrinks immediately before this,
		//then this will cause a non-critical memory leak, and a "CPU leak"
		//it's easily fixed by resizing again, or reloading
	}
}
//makes the trails disappear gradually
const doGlobalDimming = now => {
	const delta = now - t, dim = Math.round(clamp(delta + dimDepth, 0, 0xff))
	ctx.fillStyle = '#000000' + dim.toString(16).padStart(2, '0')
	ctx.fillRect(0, 0, w, h)
	t = now
	requestAnimationFrame(doGlobalDimming)
}
//draw 1st frame
requestAnimationFrame(now => {
	//set BG to pure black
	ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
	drawChars()
	t = now
})
//draw chars independent of FPS
let IntID = setInterval(drawChars, Hz_to_ms(speed)),
	RAFID = requestAnimationFrame(doGlobalDimming),
	timeoutID = false

const pause = () => {
	clearInterval(IntID)
	cancelAnimationFrame(RAFID)
}

const resize = () => {
	w = canv.width = document.body.offsetWidth
	h = canv.height = document.body.offsetHeight
	const colCount = Math.ceil(w / space)
	if (colCount > columns.length)
		do {columns.push(0)} while (columns.length < colCount)
	else columns.length = colCount
}

addEventListener('resize', () => {
	clearTimeout(timeoutID)
	timeoutID = setTimeout(resize, debounceDelay)
})