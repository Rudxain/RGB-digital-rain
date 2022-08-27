'use strict'
const RAF = requestAnimationFrame, DOC = document

/**@type {HTMLCanvasElement}*/
const canv = DOC.getElementById('c')

/**@type {CanvasRenderingContext2D}*/
const ctx = canv.getContext('2d', { alpha: false, desynchronized: true })

/**
list of y values (px, not grid) of last drawn chars
@type {number[]}
*/const height_ls = []

/**
list of color indices (pointers)
required to keep a consistent trail color
@type {number[]}
*/const color_i_ls = []

const light_query = window.matchMedia?.('(prefers-color-scheme: light)')
//dark must act as default, so light is optional
let is_dark = !light_query?.matches

const settings = {
	//🌈RYGCBM
	colors: ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],
	//not using `Intl.Segmenter`, because grapheme clusters can be rendered at *ANY* size.
	//supporting code-points instead of code-units is easier and less buggy.
	charset: [...'!?"\'`#$%&()[]{}*+-,./\\|:;<=>@^_~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'],
	speed_Hz: 24,//should only affect `draw_chars`, no-op for dimming
	grid_px: 32,//grid size
	min_y: 6, max_y: 14,
	dim_factor: 1 * (is_dark ? 1 : -1), //dimming coefficient
	resize_delay_ms: 1500
}

let anim = {};

(() => {
	let playing = false

	/**
	@type {undefined|number}
	*/let it_ID

	anim = {
		get playing() { return playing },
		set playing(b) {
			b = !!b
			const prev = playing
			playing = b

			if (!prev && b) {
				const Hz_to_ms = f => 1000 / f
				//the interval ensures `drawChars` is independent of FPS
				it_ID = setInterval(draw_chars, Hz_to_ms(settings.speed_Hz))
				RAF(do_global_dimming)
			}
			if (prev && !b)
				clearInterval(it_ID)
		}
	}
})()

const resize = () => {
	canv.width = DOC.body.clientWidth
	canv.height = DOC.body.clientHeight
	//calculate how many columns in the grid are needed to fill the whole canvas
	const columns = Math.ceil(canv.width / settings.grid_px)

	const prev = anim.playing
	anim.playing = false //prevent memory/CPU leak caused by race condition

	while (columns > height_ls.length)
		height_ls.push(0)
	height_ls.length = columns //shrink and deallocate, if necessary

	while (columns > color_i_ls.length)
		color_i_ls.push(color_i_ls.length % settings.colors.length)
	color_i_ls.length = columns

	anim.playing = prev //revert to previous play-state if needed
}

const draw_chars = () => {
	const { colors, grid_px, charset } = settings

	ctx.font = `bold ${grid_px}px monospace`

	const rand_u32 = (min = 0, max = 2 ** 32) => (Math.random() * (max - min) + min) >>> 0

	//according to MDN docs, `forEach` seems to be thread-safe here (I guess)
	height_ls.forEach((y, i) => {
		const color = colors[color_i_ls[i]]

		ctx.fillStyle = '#' + color

		let rand = rand_u32(0, charset.length)
		const x = i * grid_px
		ctx.fillText(charset[rand], x, y)

		//range is arbitrary, we have freedom to use powers of 2, for performance
		rand = rand_u32(1 << settings.min_y, 1 << settings.max_y)
		y = height_ls[i] = y > rand ? 0 : y + grid_px
		//if column has been reset, pick next color
		if (!y) color_i_ls[i] = (color_i_ls[i] + 1) % colors.length
	})
}

let t = 0 //IDK how to make this private/local and static

/**
AKA "trail fader"
@param {number} now
*/
const do_global_dimming = now => {
	if (!anim.playing) return

	let { dim_factor } = settings
	const sgn = Math.sign(dim_factor)
	dim_factor = Math.abs(dim_factor)

	const dim = Math.round(Math.min((now - t) * dim_factor, 0xff))

	//performance...
	if (dim) {
		//convert to u32 and return a B16 str whose max byte length is `B`
		const hexPad = (x = 0, B = 4) => (x >>> 0).toString(0x10).padStart(B << 1, '0')

		ctx.fillStyle = `#${sgn < 0 ? 'ffffff' : '000000'}${hexPad(dim, 1)}`
		ctx.fillRect(0, 0, canv.width, canv.height)
		//...and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
		t = now
	}
	RAF(do_global_dimming)
}

const main = () => {
	resize() //not part of anim, and has some latency, so no RAF

	ctx.fillStyle = '#' + (settings.dim_factor < 0 ? 'fff' : '000')
	ctx.fillRect(0, 0, canv.width, canv.height)

	RAF(now => { draw_chars(); t = now }) //minimal latency for 1st frame
	anim.playing = true

	/**
	needed to debounce `resize`
	@type {undefined|number}
	*/let tm_ID
	addEventListener('resize', () => {
		clearTimeout(tm_ID)
		tm_ID = setTimeout(resize, settings.resize_delay_ms)
	})

	light_query?.addEventListener?.('change', e => {
		is_dark = !e.matches
		settings.dim_factor = Math.abs(settings.dim_factor) * (is_dark ? 1 : -1)
	})
}

if (typeof require == 'undefined' && typeof WorkerGlobalScope == 'undefined')
	main()