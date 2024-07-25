const { errorsHandler } = require('../../../errors')


const routes = (fastify) => {
	fastify.post('/notificationType', async (request, reply) =>
		createNotificationType(
			fastify, request, reply
	))

	fastify.get('/notificationType', async (request, reply) =>
		readNotificationType(
			fastify, request, reply
	))

	fastify.put('/notificationType', async (request, reply) =>
		updateNotificationType(
			fastify, request, reply
	))

	fastify.delete('/notificationType', async (request, reply) =>
		deleteNotificationType(
			fastify, request, reply
	))


	fastify.get('/notificationType/getAll', async (request, reply) =>
		selectAllNotificationType(
			fastify, request, reply
	))
}


const createNotificationType = async (fastify, request, reply) => {
	let createQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		createQuery = {
			text: 	'select * from notification.create_Notification_Type(\n' +
					'	$1::text, $2::text, $3::text\n' +
					');',
			values: [
				slug, title, description
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