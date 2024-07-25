const { errorsHandler } = require('../../../errors')


const routes = (fastify) => {
	fastify.post('/accountNotification', async (request, reply) =>
		createAccountNotification(
			fastify, request, reply
	))

	fastify.get('/accountNotification', async (request, reply) =>
		readAccountNotification(
			fastify, request, reply
	))

	fastify.put('/accountNotification', async (request, reply) =>
		updateAccountNotification(
			fastify, request, reply
	))

	fastify.delete('/accountNotification', async (request, reply) =>
		deleteAccountNotification(
			fastify, request, reply
	))


	fastify.get('/accountNotification/getAll', async (request, reply) =>
		selectAllAccountNotification(
			fastify, request, reply
	))
}


const createAccountNotification = async (fastify, request, reply) => {
	let createQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		createQuery = {
			text: 	'select * from notification.create_Account_Notification(\n' +
					'	$1::bigint, $2::bigint, $3::json\n' +
					');',
			values: [
				receiverAID, notificationID, status
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