import type { Config } from 'tailwindcss'

export default {
	content: ['./**/*.html'],
	theme: {
		extend: {
			scale: {
				'250': '2.5',
			},
		},
	},
	plugins: [],
} satisfies Config
