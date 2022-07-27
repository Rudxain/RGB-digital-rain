'use strict';
const RAF = requestAnimationFrame , doc = document ,
	canv = doc.getElementById('c') ,
	ctx = canv.getContext( '2d', {alpha : false , desynchronized : true} ) ,
	heights = [] , //remember altitude of last drawn char, for each char of every column
	color_i_ls = [] , //remember colors for all columns, to keep a consistent trail
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
	mode : true,
	//🌈RYGCBM
	colors : [ 'f00','ff0','0f0','0ff','00f','f0f' ],
	//not using `Intl.Segmenter`, because grapheme clusters can be rendered with ANY size.
	//supporting code-points instead of code-units is easier and less buggy.
	charset : [...'!?"\'`#$%&()[]{}*+-,./\\|:;<=>@^_~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	speed : 24,//Hz of new chars drawn, no-op for dimming
	zoom : 32,//px of grid squares
	minCol : 6, maxCol: 14, //wtf
	dimDepth : 1, //dimming intensity
	resizeDelay : 1500//ms
}

const resize = ()=>{
	w = canv.width = doc.body.clientWidth
	h = canv.height = doc.body.clientHeight
	//calculate how many columns in the grid are needed to fill the whole canvas
	const columns = Math.ceil(w / settings.zoom)

	const play = playing //remember last state, to revert correctly
	setPlay(false) //prevent memory/CPU leak caused by race condition

	//initialize new tracking slots
	while (columns > heights.length)
		heights.push(0)
	heights.length = columns //shrink and deallocate, if necessary
	//init color pointers (indices list)
	while (columns > color_i_ls.length)
		color_i_ls.push(color_i_ls.length % settings.colors.length)
	color_i_ls.length = columns

	setPlay(play) //revert if needed
}

const drawChars = ()=>{
	const {mode, colors, zoom, charset} = settings
	if (!mode) {
		ctx.fillStyle = '#' + colors[color_i++]
		color_i %= colors.length
	}
	ctx.font = `bold ${zoom}px monospace`
	for (let i = 0, x = 0; i < heights.length; i++, x += zoom)
	{
		let y = heights[i],
			color = colors[color_i_ls[i]]

		if (mode) ctx.fillStyle = '#' + color

		let rand = randRange( 0, charset.length )>>>0 //we only need `uInt32`s, `trunc` won't help here
		ctx.fillText( charset[rand], x, y )

		//range is arbitrary, we have freedom to use powers of 2 for performance
		rand = randRange( 1 << settings.minCol, 1 << settings.maxCol )>>>0
		y = heights[i] = y > rand ? 0 : y + zoom
		//if column has been reset, pick next color
		if (!y) color_i_ls[i] = (color_i_ls[i] + 1) % colors.length
	}
}
//fade out trails
const doGlobalDimming = now => {
	if (!playing) return
	//should `*` be replaced by `+`?
	const dim = Math.round( clamp( (now - t) * settings.dimDepth, 0, 0xff ) )
	//performance...
	if (dim){
		ctx.fillStyle = '#000000' + hexPad( dim,0 )
		ctx.fillRect( 0,0,w,h )
		//...and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
		t = now
	}
	RAF(doGlobalDimming)
}

const togglePlay = ()=>{
	(playing = !playing)
	?(//the interval ensures `drawChars` is independent of FPS
		itID = setInterval( drawChars, Hz_to_ms(settings.speed) ),
		RAF( doGlobalDimming )
	):
		clearInterval(itID)
}
/*
defining SP in terms of TP is safer and more elegant,
because there's no need to add much redundancy to make it idempotent,
we get idempotence for free! so there's no risk of creating multiple RAFs and intervals
*/
const setPlay = b => { if (!playing != !b) togglePlay() }

resize() //not part of anim, and has some latency, so no RAF
RAF(now => {drawChars(); t = now}) //minimal latency for 1st frame
setPlay(true) //let the show begin!

//debouncing
addEventListener('resize', ()=>{
	clearTimeout( tmID )
	tmID = setTimeout( resize, settings.resizeDelay )
})
