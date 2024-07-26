const { errorsHandler } = require('../../../errors')
const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')

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
			text: 	'select * from notification.create_notification(\n' +
					'	$1::smallint, $2::json, $3::json, $4::timestamp without time zone\n' +
					');',
			values: [
				typeID, source, content, notificationDate
			]
		}
	}

	client.query(
		createQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			type_id: 'typeID',
			source: 'source',
			content: 'content',
			notification_date: 'notificationDate'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const readNotification = async (fastify, request, reply) => {
	let readQuery;
	const client = fastify.postgresql.client

	with (request.query) {
		readQuery = {
			text: 	'select * from notification.select_notification(\n' +
					'	$1::bigint\n' +
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

const updateNotification = async (fastify, request, reply) => {
	let updateQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		updateQuery = {
			text: 	'call notification.update_notification(\n' +
					'	$1::bigint, $2::smallint, $3::json, $4::json, $5::timestamp without time zone\n' +
					');',
			values: [
				ID, typeID, source, content, notificationDate
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

const deleteNotification = async (fastify, request, reply) => {
	let deleteQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		deleteQuery = {
			text: 	'call notification.delete_notification(\n' +
					'	$1::bigint\n' +
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



const selectAllNotification = async (fastify, request, reply) => {
	let query;
	const client = fastify.postgresql.client

	with (decodeUrlObject(request.query)) {
		query = {
			text: 	'select * from notification.find_all_notification(\n' +
					'	$1, $2, $3, $4, $5\n' +
					');',
			values: [
				ID, typeID, source, content, notificationDate
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