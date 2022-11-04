//@ts-check
'use strict'
//global/public, for debugging/testing purposes
const RGBDR_anim = (() => {
	const DOC = document, RAF = requestAnimationFrame

	const canv = DOC.getElementById('c')
	if (!(canv instanceof HTMLCanvasElement)) //shut-up TS-check
		throw new TypeError('bruh, `canv` is not a Canvas')

	const ctx = canv.getContext('2d', { alpha: false, desynchronized: true })
	if (!(ctx instanceof CanvasRenderingContext2D)) //shut-up TS-check
		throw new TypeError('bruh, `ctx` is not a Context')

	const light_query = matchMedia?.('(prefers-color-scheme: light)')
	//dark must act as default, so light is optional
	let is_dark = !light_query?.matches

	const anim = (() => {
		let playing = false

		/**
		`drawChars` interval ID
		@type {undefined|number}
		*/let it_ID

		const a = {
			get playing() { return playing },
			set playing(b) {
				b = !!b
				const prev = playing
				playing = b

				if (!prev && b) {
					/**
					Convert Hertz to corresponding mili-seconds
					@param {number} f frequency
					@return interval
					*/
					const Hz_to_ms = f => 1000 / f
					//the interval ensures `drawChars` is independent of FPS
					it_ID = setInterval(draw_chars, Hz_to_ms(a.settings.char_speed_Hz))
					RAF(full_dimmer)
				}
				if (prev && !b)
					clearInterval(it_ID)
			},
			/*
			This property shouldn't have access to `playing` and `it_ID`.
			However, to get better type inference, and organized code,
			it's defined here, instead of outside the IIFE's closure.
			*/
			settings: {
				/** `Array` of CSS hex colors */
				colors: ['f00','ff0','0f0','0ff','00f','f0f'],//🌈RYGCBM
				/** character-set/alphabet */
				charset:
					'0123456789' +
					'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
					'abcdefghijklmnopqrstuvwxyz' +
					'!?"\'`#$%&()[]{}*+-,./\\|:;<=>@^_~',
				/** `draw_chars` call-frequency */
				char_speed_Hz: 24,
				/** grid cell size */
				grid_px: 0x20,
				min_y: 6, max_y: 14,
				/** dimming coefficient */
				dim_factor: 1 * (is_dark ? 1 : -1),
				/** miliseconds to debounce until `resize` is called */
				resize_delay_ms: 1500
			}
		}
		return a
	})()

	/**
	list of y values (px, not grid) of last drawn chars
	@type {number[]}
	*/const height_ls = []

	/**
	list of color indices (pointers)
	required to keep a consistent trail color
	@type {number[]}
	*/const color_i_ls = []

	/**
	Set `canv` dimensions to fill the full viewport.

	Resize `height_ls` accordingly, padding with 0.

	Resize `color_i_ls` accordingly, padding with `index mod colors.length`.
	*/
	const resize = () => {
		canv.width = DOC.body.clientWidth
		canv.height = DOC.body.clientHeight
		//calculate how many columns in the grid are necessary to fill the whole canvas
		const columns = Math.ceil(canv.width / anim.settings.grid_px)

		const prev = anim.playing
		anim.playing = false //prevent memory/CPU leak caused by race condition

		const sleep = (/**@type {number|undefined}*/ ms) => new Promise(_ => setTimeout(_, ms))
		/*
		wait until the current frame is drawn.
		this is a temporary patch, because I have no idea what I'm doing, lol.
		I should be using some sort of mutex, or semaphore, or maybe pass a message between fns.
		*/
		sleep(0x40)

		while (height_ls.length < columns)
			height_ls.push(0)
		height_ls.length = columns //shrink and deallocate, if necessary

		while (color_i_ls.length < columns)
			color_i_ls.push(color_i_ls.length % anim.settings.colors.length)
		color_i_ls.length = columns

		anim.playing = prev //revert to previous play-state
	}

	const draw_chars = () => {
		const
			rng = Math.random,
			{ colors, grid_px, charset } = anim.settings

		ctx.font = `bold ${grid_px}px monospace`

		/** Returns a pseudo-random unsigned 32bit int. */
		const rng_u32 = (min = 0, max = 2 ** 32) => (rng() * (max - min) + min) >>> 0

		/**
		Get a pseudo-random UTF-16 code-unit from a `string`.
		@param {string} s
		*/
		const rand_CU_pick = s => s[rng() * s.length >>> 0]

		//according to MDN docs, `forEach` seems to be thread-safe here (I guess)
		height_ls.forEach((y, i) => {
			const color = colors[color_i_ls[i]]

			ctx.fillStyle = '#' + color

			const x = i * grid_px
			ctx.fillText(rand_CU_pick(charset), x, y)

			//range is arbitrary, we have freedom to use powers of 2, for performance
			const rand = rng_u32(1 << anim.settings.min_y, 1 << anim.settings.max_y)
			y = height_ls[i] = y > rand ? 0 : y + grid_px
			//if column has been reset, pick next color
			if (!y) color_i_ls[i] = (color_i_ls[i] + 1) % colors.length
		})
	}

	/** hi-precision timestamp */
	let t = 0

	/**
	AKA "trail fader"
	@param {number} now
	*/
	const full_dimmer = now => {
		if (!anim.playing) return

		const
			df = anim.settings.dim_factor, //avoid race condition, and short alias
			dim = Math.round(Math.min((now - t) * Math.abs(df), 0xff))

		{
			/**
			Check if `x` is `-0`
			@param {*} x
			*/
			const is_neg_zero = x => x === 0 && 1 / x == -Infinity

			/**
			Check if `x` is an unsigned 8bit int. Returns `false` for `BigInt`s.
			@param {*} x
			*/
			const is_u8 = x => typeof x == 'number' && x == (x & 0xff) && !is_neg_zero(x)
			console.assert(is_u8(dim))
		}

		//performance...
		if (dim) {
			const HEX_TABLE = '0123456789abcdef'

			/**
			coerce `x` to u8, then hex-encode it,
			such that nibble-pair-count <= `B`
			@param {number} x
			*/
			const hex_byte = x => (x &= 0xff, HEX_TABLE[x >> 4] + HEX_TABLE[x & 0xf])

			ctx.fillStyle = `#${Math.sign(df) < 0 ? 'ffffff' : '000000'}${hex_byte(dim)}`
			ctx.fillRect(0, 0, canv.width, canv.height)
			//...and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
			t = now
		}
		RAF(full_dimmer)
	}

	const main = () => {
		resize() //not part of anim, and has some latency, so no RAF

		ctx.fillStyle = anim.settings.dim_factor < 0 ? '#fff' : '#000'
		ctx.fillRect(0, 0, canv.width, canv.height)

		//minimal latency for 1st frame
		RAF(now => { draw_chars(); t = now })
		anim.playing = true

		/**
		timeout ID, necessary to debounce `resize`
		@type {undefined|number}
		*/let tm_ID
		addEventListener('resize', () => {
			clearTimeout(tm_ID)
			tm_ID = setTimeout(resize, anim.settings.resize_delay_ms)
		})

		light_query?.addEventListener?.('change', e => {
			is_dark = !e.matches
			anim.settings.dim_factor = Math.abs(anim.settings.dim_factor) * (is_dark ? 1 : -1)
		})
	}
	main()

	/* const tester = () => {

	} */

	return anim
})()
