const { errorsHandler } = require('../../../errors')
const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')

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
			text: 	'select * from notification.create_notification_type(\n' +
					'	$1::text, $2::text, $3::text\n' +
					');',
			values: [
				slug, title, description
			]
		}
	}

	client.query(
		createQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			slug: 'slug',
			title: 'title',
			description: 'description'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const readNotificationType = async (fastify, request, reply) => {
	let readQuery;
	const client = fastify.postgresql.client

	with (request.query) {
		readQuery = {
			text: 	'select * from notification.select_notification_type(\n' +
					'	$1::smallint\n' +
					');',
			values: [
				ID
			]
		}
	}

	client.query(
		readQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			id: 'ID'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const updateNotificationType = async (fastify, request, reply) => {
	let updateQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		updateQuery = {
			text: 	'call notification.update_notification_type(\n' +
					'	$1::smallint, $2::text, $3::text, $4::text\n' +
					');',
			values: [
				ID, slug, title, description
			]
		}
	}

	client.query(
		updateQuery
	).then((result) =>
		reply.send('OK')
	).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const deleteNotificationType = async (fastify, request, reply) => {
	let deleteQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		deleteQuery = {
			text: 	'call notification.delete_notification_type(\n' +
					'	$1::smallint\n' +
					');',
			values: [
				ID
			]
		}
	}

	client.query(
		deleteQuery
	).then((result) =>
		reply.send('OK')
	).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}



const selectAllNotificationType = async (fastify, request, reply) => {
	let query;
	const client = fastify.postgresql.client

	with (decodeUrlObject(request.query)) {
		query = {
			text: 	'select * from notification.find_all_notification_type(\n' +
					'	$1, $2, $3, $4\n' +
					');',
			values: [
				ID, slug, title, description
			]
		}
	}
	console.log(query)

	client.query(
		query
	).then((result) =>
		result.rows
	).then((rows) =>
		rows.map((row) =>
			pgRow_to_jsObject(row, {
				id: 'ID'
	}))).then((result) =>
		reply.send(result)	).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}


module.exports = routes