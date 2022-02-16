'use strict';
//setup and initialization
const canvas = document.getElementById('cw'),
	ctx = canvas.getContext('2d'),
	w = canvas.width = document.body.offsetWidth,
	h = canvas.height = document.body.offsetHeight,
	space = 24, //pixel spacing between chars
	font = (space - 8) + 'pt monospace',
	colors = ['f00', 'ff0', '0f0', '0ff', '00f', 'f0f'],
	//should these 2 be hardcoded?
	charset = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
	columns = Math.floor(w / space) + 1,
	y_pos = Array(columns).fill(0);

ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

let color_i = 0;
const matrix = function()
{
	ctx.fillStyle = '#0001'; ctx.fillRect(0, 0, w, h);
	ctx.fillStyle = '#' + colors[color_i++]; color_i %= colors.length; ctx.font = font;
	y_pos.forEach((y, i) =>
	{
		const x = i * space;
		ctx.fillText(charset[Math.random() * charset.length | 0], x, y);
		//since the offset and multiplier are arbitrary,
		//we have the freedom to use powers of 2 for better performance
		y_pos[i] = y > Math.random() * 2 ** 14 + 0x80 ? 0 : y + space;
	});
},
	FPS_to_ms = FPS => 1000 / FPS;

setInterval(matrix, FPS_to_ms(30))