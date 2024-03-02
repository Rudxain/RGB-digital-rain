//@ts-check
'use strict'
// global/public, for debugging/testing purposes
const RGBDR_anim = (() => {
	/**
	@param {number} n
	*/
	const range = function*(n) {
		for (let i = 0; i < n; i++)
			yield i
	}

	const rng = Math.random

	/**
	Returns a pseudorandom 32-bit unsigned integer
	between `min` and `max`.
	@param min inclusive
	@param max exclusive
	*/
	const rand_U32 = (min = 0, max = 2 ** 32) => (rng() * (max - min) + min) >>> 0

	/**
	Get an element at a pseudo-random index
	@template T
	@param {T[]} a
	*/
	const rand_pick = a => /**@type {T extends never ? undefined : T}*/(
		a[rng() * a.length >>> 0]
	)/*
	To simplify optimization by the engine,
	I call `rng`, rather than `randomUint32`.
	`trunc`/`floor` are misleading since index is always a u32,
	that's why I use `>>>0`.
	*/

	/**
	Convert Hertz to corresponding mili-seconds
	@param {number} f frequency
	@return interval
	*/
	const Hz_to_ms = f => 1000 / f

	const
		doc = document,
		body = doc.body,
		RAF = requestAnimationFrame,
		canv = /**@type {HTMLCanvasElement}*/(doc.getElementById('c')),
		ctx = /**@type {CanvasRenderingContext2D}*/(
			canv.getContext('2d', { alpha: false, desynchronized: true })
		)

	/**
	fills the entire `CanvasRenderingContext2D` with given `color`
	@param {string} color hex without "#"
	*/
	const ctx_fillFull = color => {
		ctx.fillStyle = '#' + color
		ctx.fillRect(0, 0, canv.width, canv.height)
		// should it preserve the previous `fillStyle`?
	}

	const light_query = matchMedia?.('(prefers-color-scheme: light)')
	// dark must act as default, so light is optional
	let is_dark = !light_query?.matches

	/**
	default pool size, and reciprocal font size
	*/
	const DROPLET_DENSITY = 0x20

	const anim = (() => {
		let playing = false

		const a = {
			get playing() { return playing },
			/**
			@param {*} state
			*/
			set playing(state) {
				const b = !!state, prev = playing
				playing = b
				// call only if transitioning from "paused" to "playing"
				if (!prev && b) RAF_id = RAF(new_frame)
				// call only if transitioning from "playing" to "paused"
				if (prev && !b) cancelAnimationFrame(RAF_id)
			},
			/*
			This property shouldn't have access to `playing`.
			However, to get better type inference, and organized code,
			it's defined here, rather than outside the (`anim`) IIFE's closure.
			*/
			settings: {
				/** hex */
				colors: ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],//🌈RYGCBM
				/**
				character-set/alphabet.
				must only contain codepoints, not grapheme-clusters,
				because the latter can be rendered at any size.
				*/
				charset:
					[...('0123456789' +
						'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
						'abcdefghijklmnopqrstuvwxyz')],
				/** droplet falling speed */
				droplet_Hz: 24,
				/** ratio to multiply with canvas dimensions */
				droplet_rel_size: 1 / DROPLET_DENSITY,
				/** dimming coefficient */
				dim_factor: 3 / 4 * (is_dark ? 1 : -1),
				/** miliseconds to debounce until `resize` is called */
				resize_delay_ms: 250
			}
		}
		return a
	})()

	const Droplet = class {
		#x
		#y
		#max_y
		#color
		/**
		Create with default props.
		Use `init` to set them.
		*/
		constructor() {
			this.#x = this.#y = 0
			this.#max_y = 1
			this.#color = '777' // visible in light and dark schemes
		}

		/**
		Sets/Resets the props. Useful for [pooling](https://en.wikipedia.org/wiki/Object_pool_pattern).
		@param {number} x finite
		@param {number} y finite
		@param {number} max_y finite
		@param {string} color 3 hexadecimal nibbles.

		Not a pointer to `settings.colors`,
		because the droplet must hold a consistent color,
		and a pointer could become invalid at any time.
		*/
		init(x, y, max_y, color) {
			if (!isFinite(x) || !isFinite(y))
				throw new RangeError(`invalid coords: x=${x} y=${y}`)
			if (!isFinite(max_y) || y > max_y)
				throw new RangeError(`invalid max_y: ${max_y}`)
			if (! /^[a-f\d]{3}$/gi.test(color))
				throw new RangeError(`invalid color: ${color}`)

			this.#x = x
			this.#y = y
			this.#max_y = max_y
			this.#color = color
			return this
		}

		get x() { return this.#x }
		get y() { return this.#y }
		get max_y() { return this.#max_y }
		get color() { return this.#color }

		/**
		Increment `y` by `n`.
		@param {number} n 
		@throws {RangeError} if result is non-finite, usually on overflow
		@return updated `y`
		*/
		inc_y(n) {
			// don't do this at home, kids!
			const y = this.#y += n
			if (!isFinite(y))
				throw new RangeError(`${y}`)
			return y
		}
	}

	const get_droplet_size = () => anim.settings.droplet_rel_size * Math.max(canv.width, canv.height)

	// pre-allocate.
	// https://en.wikipedia.org/wiki/Object_pool_pattern
	const droplet_ls = Array.from({ length: DROPLET_DENSITY }, () => new Droplet)

	/**
	Set `canv` dimensions to fill the full viewport.
	And set font-size accordingly
	*/
	const resize = () => {
		const scale = devicePixelRatio
		canv.width = body.clientWidth * scale >>> 0
		canv.height = body.clientHeight * scale >>> 0
		// is normalization necessary?
		//ctx.scale(scale, scale)
		ctx.font = `bold ${get_droplet_size()}px monospace`
	}

	/**
	@param {DOMHighResTimeStamp} now
	*/
	const draw_droplets = now => {
		// should it `ceil` instead of `trunc`?
		const times = (now - last_drop) / Hz_to_ms(anim.settings.droplet_Hz) >>> 0
		if (times == 0)
			return

		const
			{ colors, charset } = anim.settings,
			size = get_droplet_size()

		// according to MDN docs, `forEach` seems to be thread-safe here (I guess)
		droplet_ls.forEach(droplet => {
			// this is outside `for...of`
			// to take advantage of batch-rendering
			ctx.fillStyle = '#' + droplet.color

			// unlock speed limit to go beyond FPS ⚡
			for (const _ of range(times)) {
				ctx.fillText(rand_pick(charset), droplet.x, droplet.y)

				if (droplet.y > droplet.max_y) {
					const col = rand_pick(colors)
					droplet.init(
						rand_U32(0, canv.width),
						rng(),
						rand_U32(canv.height * 3 / 4, canv.height + size),
						col
					)
					ctx.fillStyle = '#' + col
				}
				else droplet.inc_y(size)
			}
		})
		last_drop = now
	}

	/**
	AKA "trail fader"
	@param {DOMHighResTimeStamp} now
	*/
	const full_dimmer = now => {
		// avoid race condition, and get a shorter alias
		const df = anim.settings.dim_factor

		/** u8 that specifies how much to dim the canvas */
		const dim = Math.round(Math.min((now - last_dim) * Math.abs(df), 0xff))

		// performance [0]...
		if (dim) {
			ctx_fillFull((df < 0 ? 'ffffff' : '000000') + dim.toString(0x10).padStart(2, '0'))
			// [0]... and ensure hi-FPS don't cause `dim` to get stuck as a no-op.
			last_dim = now
		}
	}

	// is it possible to rewrite both fns to use only 1 timestamp?
	let
		/**@type {DOMHighResTimeStamp}*/
		last_drop = 0,
		/**@type {DOMHighResTimeStamp}*/
		last_dim = 0,
		// we know `0` isn't associated with any RAF,
		// so we can use it as a "null pointer"
		RAF_id = 0

	/**
	@param {DOMHighResTimeStamp} now
	*/
	const new_frame = now => {
		if (!anim.playing) return;
		// this must run 1st,
		// otherwise all frames would be darker than intended
		full_dimmer(now)
		draw_droplets(now)
		RAF_id = RAF(new_frame)
	}

	const main = () => {
		resize() // not part of anim, and has some latency, so no RAF
		const
			{ dim_factor, colors } = anim.settings,
			size = get_droplet_size()

		ctx_fillFull(dim_factor < 0 ? 'fff' : '000')

		droplet_ls.forEach((d, i) => d.init(
			i * size, // uniformity
			rng(), // details ✨
			rand_U32(canv.height * 3 / 4, canv.height + size),
			colors[i % colors.length] // everyone will be used
		))
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
			// can't use alias, because we need live version
			anim.settings.dim_factor = Math.abs(anim.settings.dim_factor) * (is_dark ? 1 : -1)
		})
	}
	main()

	return anim
})()
