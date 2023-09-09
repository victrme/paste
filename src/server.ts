import { Redis } from 'ioredis'

const redis = Bun.env.NODE_ENV === 'production' ? new Redis(Bun.env.REDIS_URL ?? '') : devRedis()

Bun.serve({
	async fetch(req: Request): Promise<Response> {
		//
		const url = new URL(req.url)
		const path = url.pathname.replace('/', '')
		const requestsHTML = req.headers.get('accept')?.includes('text/html')

		if (req.method === 'GET' && requestsHTML) {
			return new Response(Bun.file('src/index.html'))
		}

		if (req.method === 'POST') {
			const { id } = await getClientData(req)
			const content = await redis.get(id)

			if (content === null) {
				await redis.set(id, '')
			}

			return new Response(content, { headers: { 'HX-Replace-Url': `/${id}` } })
		}

		if (req.method === 'PUT') {
			const { id, content } = await getClientData(req)

			if (id !== '') {
				await redis.set(id, content)
			}

			return new Response('')
		}

		if (req.method === 'DELETE') {
			const { id } = await getClientData(req)
			await redis.del(id)
			return new Response('', { headers: { 'HX-Replace-Url': '/' } })
		}

		return new Response(Bun.file(path))
	},

	error(error) {
		return new Response(
			JSON.stringify({
				message: error.message,
				stack: error.stack,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	},
})

function devRedis(): Pick<Redis, 'get' | 'set' | 'del'> {
	const db: { [key: string]: string } = {
		hello: 'world',
		'': `Hello world, this is another paste service !

- No login, you can type a name above to start a new paste.
- Every paste are public, so you can delete other people's pastes.
- Saves automatically on typing
- Limited to 2048 characters
- You cannot edit this one, but nice try`,
	}

	return {
		get: async (key: string) => {
			return db[key] ? db[key] : null
		},
		set: async (key: string, value: string) => {
			db[key] = value
			return 'OK'
		},
		del: async (...keys: any) => {
			for (const key of keys) delete db[key]
			return keys.length
		},
	}
}

async function getClientData(req: Request): Promise<{ id: string; content: string }> {
	const formData = await req.formData()
	const id = formData.get('id') as string
	const content = formData.get('content') as string

	return { id, content }
}
