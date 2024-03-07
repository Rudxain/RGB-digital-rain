"use strict"
// global/public, for debugging/testing purposes
/*exported RGBDR_anim*/
const RGBDR_anim = (() => {
	const
		/** Maximum `Uint8` */
		MAX_U8 = 0xff,
		/** Maximum `Uint32` + 1 */
		POW2_32 = 2 ** 32 //eslint-disable-line no-magic-numbers

	/** `const isFinite` binding, for purity */
	const not_inf_nan = isFinite

	/**
	checks if `x` is not finite
	@param {number} x
	*/
	const is_inf_nan = x => !not_inf_nan(x)

	/**
	@param {number} n
	*/
	//eslint-disable-next-line no-restricted-syntax
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
	const rand_U32 = (min = 0, max = POW2_32) =>
		(rng() * (max - min) + min) >>> 0

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
	const Hz_to_ms = f => 1000 / f //eslint-disable-line no-magic-numbers

	const
		doc = document,
		body = doc.body,
		RAF = requestAnimationFrame,
		canv = /**@type {HTMLCanvasElement}*/(doc.getElementById("c")),
		ctx = /**@type {CanvasRenderingContext2D}*/(
			canv.getContext("2d", { alpha: false, desynchronized: true })
		)

	let
		/** `canv.width` */
		w = 1,
		/** `canv.height` */
		h = 1

	/**
	fills the entire `CanvasRenderingContext2D` with given `color`
	@param {string} color hex without "#"
	*/
	const ctx_fillFull = color => {
		ctx.fillStyle = "#" + color
		ctx.fillRect(0, 0, w, h)
		// should it preserve the previous `fillStyle`?
	}

	const light_query = matchMedia?.("(prefers-color-scheme: light)")
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
				colors: ["f00", "ff0", "0f0", "0ff", "00f", "f0f"],//🌈RYGCBM
				/**
				character-set/alphabet.
				must only contain codepoints, not grapheme-clusters,
				because the latter can be rendered at any size.
				*/
				charset:
					[...("0123456789" +
						"ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
						"abcdefghijklmnopqrstuvwxyz")],
				/** droplet falling speed */
				droplet_Hz: 24,
				/** ratio to multiply with canvas dimensions */
				droplet_rel_size: 1 / DROPLET_DENSITY,
				/** dimming coefficient */
				dim_factor: 3 / 4 * (is_dark ? 1 : -1),//eslint-disable-line no-magic-numbers
				/** miliseconds to debounce until `resize` is called */
				resize_delay_ms: 250
			}
		}
		return a
	})()

	const Droplet = class {
		/*
		there's no `size` field,
		because I want all droplets to share the same size,
		even when that size changes at runtime.

		I'm aware of the implications,
		such as trails with old sizes,
		and trail "self-overlay".
		*/
		#x
		#y
		/** expiration height */
		#max_y
		/**
		Not a pointer to `settings.colors`,
		because the droplet must hold a consistent color,
		and a pointer could be invalidated at any time.
		*/
		#color
		/**
		Create with default fields.
		Use `init` to set them.
		*/
		constructor() {
			this.#x = this.#y = 0
			this.#max_y = MAX_U8
			// visible in light and dark schemes,
			// for easier debugging
			this.#color = "777"
		}

		/**
		Set `x` and `y` coordinates,
		`max_y` is randomly-generated if `gen_max`,
		`color` is randomly-picked from settings.
		@param {number} x finite
		@param {number} y finite
		*/
		init(x, y, gen_max = false) {
			if (is_inf_nan(x) || is_inf_nan(y))
				throw new RangeError(`invalid coords: x=${x} y=${y}`)

			this.#x = x
			this.#y = y
			if (gen_max)
				//eslint-disable-next-line no-magic-numbers
				this.#max_y = rand_U32(h * 3 / 4, h + droplet_abs_size)
			this.#color = rand_pick(anim.settings.colors)
			return this
		}
		/**
		coords, `max_y` and `color` are random.
		*/
		init_auto() {
			return this.init(rng() * w, rng() * droplet_abs_size, true)
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
			if (is_inf_nan(y))
				throw new RangeError(`${y}`)
			return y
		}
	}

	/** absolute pixel size */
	let droplet_abs_size = 1

	/**
	Set `canv` dimensions to fill the full viewport.
	And set font-size accordingly
	*/
	const resize = () => {
		const { clientWidth, clientHeight } = body
		canv.style.width = clientWidth + "px"
		canv.style.height = clientHeight + "px"
		const scale = devicePixelRatio
		w = canv.width = clientWidth * scale >>> 0
		h = canv.height = clientHeight * scale >>> 0
		//ctx.scale(scale, scale) // is normalization necessary?
		// should it be W, H, max(W,H), min(W,H), hypot(W,H), or sqrt(W * H)?
		droplet_abs_size = anim.settings.droplet_rel_size * w
		ctx.font = `bold ${droplet_abs_size}px monospace`
	}

	/**
	list of auto-generated `Droplet`s
	*/
	const droplets_auto =
		// https://en.wikipedia.org/wiki/Object_pool_pattern
		Array.from({
			// div2 leaves enough room
			// for the user to spawn new droplets
			length: DROPLET_DENSITY >> 1
		}, () => new Droplet)
	/**
	list of user-spawned `Droplet`s
	@type {Droplet[]}
	*/
	const droplets_user = []

	/**
	fill a character randomly-picked from `charset`, into `ctx`.

	unlike `fillText`, this is centered.
	@param {number} x
	@param {number} y
	*/
	const draw_char = (x, y) => {
		/** why does `4` center but not `2`? */
		const CENTERING_FACTOR = 4
		const size = droplet_abs_size / CENTERING_FACTOR
		ctx.fillText(rand_pick(anim.settings.charset), x - size, y + size)
	}

	/**
	@param {DOMHighResTimeStamp} now
	*/
	const draw_droplets = now => {
		/**
		max number of times to step per batch
		*/
		const steps =
			// should it `ceil` instead of `trunc`?
			(now - last_drop) / Hz_to_ms(anim.settings.droplet_Hz) >>> 0
		// guard against hi-FPS and low-speed
		if (steps == 0)
			return

		const size = droplet_abs_size

		// the shallow-copy is needed because of `splice`,
		// and because I'm too lazy to use a classic `for` loop
		// with mutable indices.
		for (const [i, d] of [...droplets_user].entries()) {
			// this is outside `for...of`
			// to take advantage of batch-rendering
			ctx.fillStyle = "#" + d.color

			// unlock speed limit to go beyond FPS ⚡
			for (const _ of range(steps)) {
				draw_char(d.x, d.y)

				// expire after going out-of-bounds
				if (d.y > h) {
					droplets_user.splice(i, 1)
					// immediately stop processing `d`
					break
				}
				d.inc_y(size)
			}
		}
		// according to MDN, this is thread-safe
		for (const d of droplets_auto) {
			ctx.fillStyle = "#" + d.color

			for (const _ of range(steps)) {
				draw_char(d.x, d.y)

				if (d.y > d.max_y) {
					d.init_auto()
					/*
					this isn't necessary,
					but it adds an intentional delay
					before processing the droplet's `init`ed version.
					It also reduces the workload of each batch.
					*/break
				}
				d.inc_y(size)
			}
		}

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
		const dim = Math.round(
			Math.min((now - last_dim) * Math.abs(df), MAX_U8)
		)

		// performance [0]...
		if (dim) {
			//eslint-disable-next-line no-magic-numbers
			ctx_fillFull((df < 0 ? "ffffff" : "000000") + dim.toString(0x10).padStart(2, "0"))
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
		if (!anim.playing) return
		// this must run 1st,
		// otherwise all frames would be darker than intended
		full_dimmer(now)
		draw_droplets(now)
		RAF_id = RAF(new_frame)
	}

	const main = () => {
		// not part of anim, and has some latency, so no RAF
		resize()
		ctx_fillFull(anim.settings.dim_factor < 0 ? "fff" : "000")
		// these don't work as desired
		//ctx.textAlign = 'center'
		//ctx.textBaseline = 'middle'

		for (const d of droplets_auto)
			d.init_auto()

		anim.playing = true

		canv.addEventListener("click", e => {
			const scale = devicePixelRatio
			droplets_user.push((new Droplet).init(
				e.clientX * scale, e.clientY * scale
			))
			/*
			Because of batch-rendering,
			the droplet will wait to be drawn
			together with all the other ones.

			So the user will experience a delay
			if the speed-setting is low
			*/
		})

		/**
		timeout ID, necessary to debounce `resize`
		@type {undefined|number}
		*/let tm_ID
		// should this be attached to `body` rather than `window`?
		addEventListener("resize", () => {
			clearTimeout(tm_ID)
			tm_ID = setTimeout(resize, anim.settings.resize_delay_ms)
		})

		light_query?.addEventListener?.("change", e => {
			is_dark = !e.matches
			// can't use alias, because we need live version
			anim.settings.dim_factor = Math.abs(anim.settings.dim_factor) * (is_dark ? 1 : -1)
		})
	}
	main()

	return anim
})()
