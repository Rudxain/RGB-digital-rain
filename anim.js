'use strict';
//setup and initialization
const canvas = document.getElementById('c'),
	ctx = canvas.getContext('2d', {alpha: false, desynchronized: true}),
	w = canvas.width = document.body.offsetWidth,
	h = canvas.height = document.body.offsetHeight,
	space = 24, //pixel spacing between chars
	//red, yellow, green, cyan, blue, magenta
	colors = ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],
	charset = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	columns = new Uint32Array(Math.ceil(w / space)),
	FPS_to_ms = f => 1000 / f,
	randRange = (min, max) => Math.random() * (max - min) + +min

let color_i = 0, start
const baseFrame = () => {
	ctx.fillStyle = '#' + colors[color_i++]; ctx.font = space + 'px monospace'
	for (let i = 0, x = 0; i < columns.length; i++, x += space) {
		const y = columns[i]
		//draw a char
		ctx.fillText(charset[randRange(0, charset.length) | 0], x, y)
		//since the range is arbitrary, we have freedom to use powers of 2 for performance
		columns[i] = y > (randRange(1 << 7, 1 << 14) >>> 0) ? 0 : y + space
	}
}
const nextFrame = now => {
	if (now - start > FPS_to_ms(30)) {
		//global dimming, make the trail disappear gradually
		ctx.fillStyle = '#0001'; ctx.fillRect(0, 0, w, h)
		color_i %= colors.length
		baseFrame()
		start = now
	}
	requestAnimationFrame(nextFrame)
}

requestAnimationFrame(now => {
	//set BG to pure black
	ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
	baseFrame()
	start = now
})
requestAnimationFrame(nextFrame)
