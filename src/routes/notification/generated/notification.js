const { errorsHandler } = require('../../../errors')


const routes = (fastify) => {
	fastify.post('/notification', async (request, reply) =>
		createNotification(
			fastify, request, reply
	))

	fastify.get('/notification', async (request, reply) =>
		readNotification(
			fastify, request, reply
	))

	fastify.put('/notification', async (request, reply) =>
		updateNotification(
			fastify, request, reply
	))

	fastify.delete('/notification', async (request, reply) =>
		deleteNotification(
			fastify, request, reply
	))


	fastify.get('/notification/getAll', async (request, reply) =>
		selectAllNotification(
			fastify, request, reply
	))
}


const createNotification = async (fastify, request, reply) => {
	let createQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		createQuery = {
			text: 	'select * from notification.create_Notification(\n' +
					'	$1::smallint, $2::json, $3::json, $4::timestamp without time zone\n' +
					');',
			values: [
				typeID, source, content, notificationDate
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