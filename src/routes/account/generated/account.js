const { errorsHandler } = require('../../../errors')


const routes = (fastify) => {
	fastify.post('/account', async (request, reply) =>
		createAccount(
			fastify, request, reply
	))

	fastify.get('/account', async (request, reply) =>
		readAccount(
			fastify, request, reply
	))

	fastify.put('/account', async (request, reply) =>
		updateAccount(
			fastify, request, reply
	))

	fastify.delete('/account', async (request, reply) =>
		deleteAccount(
			fastify, request, reply
	))


	fastify.get('/account/getAll', async (request, reply) =>
		selectAllAccount(
			fastify, request, reply
	))
}


const createAccount = async (fastify, request, reply) => {
	let createQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		createQuery = {
			text: 	'select * from account.create_Account(\n' +
					'	\n' +
					');',
			values: [
				
			]
		}
	}

	client.query(createQuery)
		.then((result) => 
			reply.send(result.rows[0]))
		.catch(error =>
			errorsHandler(reply, error)
	)

	return reply
}

module.exports = routes