'use strict'
const RAF = requestAnimationFrame , doc = document ,
	canv = doc.getElementById('c') ,
	ctx = canv.getContext( '2d', {alpha:false , desynchronized:true} ) ,
	//to remember altitude of last drawn char, for each char of every column
	heights = [] ,
	//to remember colors for all columns, to keep a consistent trail.
	//it's an index list, because we need to do pointer arithmetic
	color_i_ls = [] ,
	sign_abs = x => [Math.sign(x), Math.abs(x)] ,
	Hz_to_ms = f => 1000 / f ,
	//unary `+` is used to avoid accidental concat
	randRange = (min=0 , max=1) => Math.random() * (max - min) + +min ,
	clamp = (x, min, max) => x > max ? max : x < min ? min : x ,
	//convert to u32 and return a B16 str whose max byte length is `B`
	hexPad = (x, B = 4) => (x >>> 0) .toString(0x10) .padStart(B << 1, '0') ,
	light_query = window.matchMedia?.('(prefers-color-scheme: light)') ,
	DEFAULT_DIM = 1

let w=0, h=0,
	color_i = 0,
	t, it_ID, tm_ID,
	playing = false,
	//dark must act as default, so light is optional
	is_dark = !light_query?.matches

const settings = {
	mode : true,
	//🌈RYGCBM
	colors : [ 'f00','ff0','0f0','0ff','00f','f0f' ],
	//not using `Intl.Segmenter`, because grapheme clusters can be rendered at *ANY* size.
	//supporting code-points instead of code-units is easier and less buggy.
	charset : [...'!?"\'`#$%&()[]{}*+-,./\\|:;<=>@^_~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	speed_Hz : 24,//should only affect `draw_chars`, no-op for dimming
	zoom_px : 32,//grid square size
	min_y : 6, max_y: 14, //wtf
	dim_factor : DEFAULT_DIM * (is_dark ? 1 : -1), //dimming coefficient
	resize_delay_ms : 1500
}

const toggle_play = ()=>{
	playing = !playing
	if (playing) {
		//the interval ensures `drawChars` is independent of FPS
		it_ID = setInterval( draw_chars, Hz_to_ms(settings.speed_Hz) )
		RAF( do_global_dimming )
	}
	else
		clearInterval(it_ID)
}/*
defining SP in terms of TP is safer and more elegant,
because there's not much need for redundancy to make it idempotent,
we get idempotence "for free"! so there's no risk of creating multiple RAFs and intervals
*/
const set_play = b => { if (!playing != !b) toggle_play() }

const resize = ()=>
{
	w = canv.width = doc.body.clientWidth
	h = canv.height = doc.body.clientHeight
	//calculate how many columns in the grid are needed to fill the whole canvas
	const columns = Math.ceil(w / settings.zoom_px)

	const play = playing
	set_play(false) //prevent memory/CPU leak caused by race condition

	//initialize new tracking slots
	while (columns > heights.length)
		heights.push(0)
	heights.length = columns //shrink and deallocate, if necessary

	//init color pointers (indices list)
	while (columns > color_i_ls.length)
		color_i_ls.push(color_i_ls.length % settings.colors.length)
	color_i_ls.length = columns

	set_play(play) //revert if needed
}

const draw_chars = ()=>
{
	const {mode, colors, zoom_px, charset} = settings

	if (!mode) {
		ctx.fillStyle = '#' + colors[color_i++]
		color_i %= colors.length
	}

	ctx.font = `bold ${zoom_px}px monospace`

	//according to MDN docs, `forEach` seems to be thread-safe here (I guess)
	heights.forEach((y, i) => {
		const color = colors[color_i_ls[i]]

		if (mode) ctx.fillStyle = '#' + color

		let rand = randRange( 0, charset.length )>>>0 //we only need `u32`s, `trunc` won't help here
		const x = i * zoom_px
		ctx.fillText( charset[rand], x, y )

		//range is arbitrary, we have freedom to use powers of 2 for performance
		rand = randRange( 1 << settings.min_y, 1 << settings.max_y )>>>0
		y = heights[i] = y > rand ? 0 : y + zoom_px
		//if column has been reset, pick next color
		if (!y) color_i_ls[i] = (color_i_ls[i] + 1) % colors.length
	})
}
/**
AKA "trail fader"
@param {number} now
*/
const do_global_dimming = now =>
{
	if (!playing) return

	const {dim_factor} = settings ,
		[sgn, abs] = sign_abs(dim_factor) ,
		dim = Math.round( clamp( (now - t) * abs, 0, 0xff ) )
	//performance...
	if (dim){
		ctx.fillStyle = `#${sgn < 0 ? 'ffffff' : '000000'}${hexPad( dim,1 )}`
		ctx.fillRect( 0,0,w,h )
		//...and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
		t = now
	}
	RAF( do_global_dimming )
}

const main = ()=>{
	resize() //not part of anim, and has some latency, so no RAF
	ctx.fillStyle = '#' + (settings.dim_factor < 0 ? 'fff' : '000')
	ctx.fillRect( 0,0,w,h )
	RAF(now => {draw_chars(); t = now}) //minimal latency for 1st frame
	set_play(true) //Welcome to The Matrix

	//debounced, for energy saving
	addEventListener('resize', ()=>{
		clearTimeout( tm_ID )
		tm_ID = setTimeout( resize, settings.resize_delay_ms )
	})

	light_query?.addEventListener?.('change', e => {
		if (e.matches) {
			is_dark = false
			settings.dim_factor = -Math.abs(settings.dim_factor)
		}
		else {
			is_dark = true
			settings.dim_factor = Math.abs(settings.dim_factor)
		}
	})
}
//Python `if __name__=='__main__'` equivalent.
//`main` will only run if the runtime isn't Node and not a `WebWorker`
if (typeof require == 'undefined' && typeof WorkerGlobalScope == 'undefined')
	main()