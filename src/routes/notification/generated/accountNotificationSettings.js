const { errorsHandler } = require('../../../errors')


const routes = (fastify) => {
	fastify.post('/accountNotificationSettings', async (request, reply) =>
		createAccountNotificationSettings(
			fastify, request, reply
	))

	fastify.get('/accountNotificationSettings', async (request, reply) =>
		readAccountNotificationSettings(
			fastify, request, reply
	))

	fastify.put('/accountNotificationSettings', async (request, reply) =>
		updateAccountNotificationSettings(
			fastify, request, reply
	))

	fastify.delete('/accountNotificationSettings', async (request, reply) =>
		deleteAccountNotificationSettings(
			fastify, request, reply
	))


	fastify.get('/accountNotificationSettings/getAll', async (request, reply) =>
		selectAllAccountNotificationSettings(
			fastify, request, reply
	))
}


const createAccountNotificationSettings = async (fastify, request, reply) => {
	let createQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		createQuery = {
			text: 	'select * from notification.create_Account_Notification_Settings(\n' +
					'	$1::bigint, $2::json\n' +
					');',
			values: [
				accountID, settings
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