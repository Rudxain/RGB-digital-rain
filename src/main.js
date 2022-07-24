'use strict';
const RAF = requestAnimationFrame , doc = document ,
	canv = doc .getElementById( 'c' ) ,
	ctx = canv .getContext( '2d', {alpha : false , desynchronized : true} ) ,
	heights = [] , //remember altitude of last drawn char, for each char of every column
	colorPtrs = [] ,
	Hz_to_ms = f => 1000 / f ,
	//interval [min, max), unary `+` is used to avoid accidental concat
	randRange = (min, max) => Math.random() * (max - min) + +min ,
	clamp = (x, min, max) => x > max ? max : x < min ? min : x , //[min, max]
	//convert to uint32 and return a base16 string whose max byte length is `B + 1`
	hexPad = (x, B = 3) => (x >>> 0) .toString(0x10) .padStart(((B & 3) + 1 ) << 1, '0')

let w, h,
	color_i = 0,
	t, itID, tmID,
	playing

const settings = {
	mode: true,
	//🌈RYGCBM
	colors: [ 'f00','ff0','0f0','0ff','00f','f0f' ],
	//not using `Intl.Segmenter`, because grapheme clusters can be rendered with ANY size
	//supporting code-points instead of code-units is easier and less buggy
	charset: [...'!?"\'`#$%&()[]{}*+-,./\\|:;<=>@^_~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	speed: 24,//Hz of new chars drawn, no-op for dimming
	zoom: 32,//px of grid squares
	minCol: 6, maxCol: 14, //wtf
	dimDepth: 1, //dimming intensity
	resizeDelay: 1500//ms
}

const resize = ()=>{
	w = canv.width = doc.body.clientWidth
	h = canv.height = doc.body.clientHeight
	//calculate how many columns in the grid are needed to fill the whole canvas
	const columns = Math.ceil(w / settings.zoom)

	const play = playing //remember last state, to revert correctly
	if (play) togglePlay() //prevent memory/CPU leak caused by race condition

	//initialize new tracking slots
	while (columns > heights.length) heights.push(0)
	heights.length = columns //shrink and deallocate, if necessary
	//init color pointers
	while (columns > colorPtrs.length)
		colorPtrs.push(colorPtrs.length % settings.colors.length)
	colorPtrs.length = columns

	if (play) togglePlay() //revert if needed
}
const drawChars = ()=>{
	const {colors, zoom} = settings
	if (!settings.mode) {
		ctx.fillStyle = '#' + colors[color_i++]
		color_i %= colors.length
	}
	ctx.font = `bold ${zoom}px monospace`
	for (let i = 0, x = 0; i < heights.length; i++, x += zoom)
	{
		const {charset} = settings
		let y = heights[i], color = colors[colorPtrs[i]]
		if (settings.mode) ctx.fillStyle = '#' + color

		let rand = randRange( 0, charset.length )>>>0
		ctx.fillText( charset[rand], x, y )
		//range is arbitrary, we have freedom to use powers of 2 for performance
		rand = randRange( 1 << settings.minCol, 1 << settings.maxCol )>>>0
		y = heights[i] = y > rand ? 0 : y + zoom
		//if column is reset, select next color
		if (!y) colorPtrs[i] = (colorPtrs[i] + 1) % colors.length
	}
}
//fade out trails
const doGlobalDimming = now => {
	if (!playing) return
	const Δ = now - t, dim = Math.round( clamp( Δ * settings.dimDepth, 0, 0xff ) )
	//performance...
	if (dim){
		ctx.fillStyle = '#000000' + hexPad( dim, 0 )
		ctx.fillRect( 0,0,w,h )
		//...and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
		t = now
	}
	RAF( doGlobalDimming )
}
//the interval ensures `drawChars` is independent of FPS
const togglePlay = ()=>{
	(playing = !playing)
	?(
		itID = setInterval( drawChars, Hz_to_ms(settings.speed) ),
		RAF( doGlobalDimming )
	): //I hate `else` lol
		clearInterval(itID)
}

resize() //not part of anim, and has some latency, so no RAF
RAF(now => {drawChars(); t = now}) //minimal latency for 1st frame
togglePlay()

//debounced
addEventListener('resize', ()=>{
	clearTimeout( tmID )
	tmID = setTimeout( resize, settings.resizeDelay )
})
