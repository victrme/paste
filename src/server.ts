import { Redis } from 'ioredis'

const redis = Bun.env.NODE_ENV === 'production' ? new Redis(Bun.env.REDIS_URL ?? '') : devRedis()

Bun.serve({
	async fetch(req: Request): Promise<Response> {
		//
		const url = new URL(req.url)
		const path = url.pathname.replace('/', '')
		const requestsHTML = req.headers.get('accept')?.includes('text/html')

		if (req.method === 'GET' && requestsHTML) {
			return new Response(Bun.file('src/index.html'), {
				headers: {
					'cache-control': 'max-age=3600, public',
				},
			})
		}

		if (req.method === 'POST') {
			const data = await getClientData(req)
			const hash = Bun.hash(data.id).toString()
			const content = await redis.get(hash)

			if (content === null) {
				await redis.set(hash, '')
			}

			return new Response(content, { headers: { 'HX-Replace-Url': `/${data.id}` } })
		}

		if (req.method === 'PUT') {
			const { id, content } = await getClientData(req)
			const hash = Bun.hash(id).toString()

			if (id !== '') {
				await redis.set(hash, content)
			}

			return new Response('')
		}

		if (req.method === 'DELETE') {
			const { id } = await getClientData(req)
			const hash = Bun.hash(id).toString()
			await redis.del(hash)

			return new Response('', { headers: { 'HX-Replace-Url': '/' } })
		}

		return new Response(Bun.file(path), {
			headers: {
				'cache-control': 'max-age=604800, public',
			},
		})
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

async function getClientData(req: Request): Promise<{ id: string; content: string }> {
	const formData = await req.formData()
	const id = (formData.get('id') ?? '') as string
	const content = (formData.get('content') ?? '') as string

	return { id, content }
}

function devRedis(): Pick<Redis, 'get' | 'set' | 'del'> {
	const db: { [key: string]: string } = {
		'1019145960556548909': 'world',
		'290873116282709081': `Hello world, this is another paste service !

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
