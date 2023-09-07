import { Redis } from 'ioredis'

const redis = Bun.env.NODE_ENV === 'production' ? new Redis(Bun.env.REDIS_URL ?? '') : devRedis()
const index = Bun.file('src/index.html')

Bun.serve({
	async fetch(req: Request): Promise<Response> {
		//

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
			await redis.set(id, content)

			return new Response('')
		}

		if (req.method === 'DELETE') {
			const { id } = await getClientData(req)
			await redis.del(id)
			return new Response('', { headers: { 'HX-Replace-Url': '/' } })
		}

		return new Response(index)
	},
})

function devRedis(): Pick<Redis, 'get' | 'set' | 'del'> {
	const db: { [key: string]: string } = {
		hello: 'world',
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

// import { Database } from 'bun:sqlite'
// const db = new Database('')

// db.query('CREATE TABLE Pastes (id VARCHAR(255) PRIMARY KEY,content VARCHAR(1000));').run()
// db.query("INSERT INTO Pastes (id, content) VALUES ('hello', 'world');").run()

// function getAll(): Paste[] | undefined {
// 	const all = db.query('SELECT * FROM Pastes').all() as Paste[]
// 	return all
// }

// function getRow(id: string): Paste | undefined {
// 	const all = db.query('SELECT * FROM Pastes WHERE id = ?;').all(id) as Paste[]
// 	return all.length > 0 ? all[0] : undefined
// }

// function addRow(id: string): undefined {
// 	db.query("INSERT INTO Pastes (id, content) VALUES (?, '');").run(id)
// }

// function updateRow(id: string, content: string): undefined {
// 	db.query('UPDATE Pastes SET content = ?1 WHERE id = ?2;').run(content, id)
// }

// function deleteRow(id: string): undefined {
// 	db.query('DELETE FROM Pastes WHERE id = ?;').run(id)
// }
