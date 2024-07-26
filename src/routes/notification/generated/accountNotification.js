const { errorsHandler } = require('../../../errors')
const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')

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
			text: 	'select * from notification.create_account_notification(\n' +
					'	$1::bigint, $2::bigint, $3::json\n' +
					');',
			values: [
				receiverAID, notificationID, status
			]
		}
	}

	client.query(
		createQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			receiver_aid: 'receiverAID',
			notification_id: 'notificationID',
			status: 'status'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const readAccountNotification = async (fastify, request, reply) => {
	let readQuery;
	const client = fastify.postgresql.client

	with (request.query) {
		readQuery = {
			text: 	'select * from notification.select_account_notification(\n' +
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

const updateAccountNotification = async (fastify, request, reply) => {
	let updateQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		updateQuery = {
			text: 	'call notification.update_account_notification(\n' +
					'	$1::bigint, $2::bigint, $3::bigint, $4::json\n' +
					');',
			values: [
				ID, receiverAID, notificationID, status
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

const deleteAccountNotification = async (fastify, request, reply) => {
	let deleteQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		deleteQuery = {
			text: 	'call notification.delete_account_notification(\n' +
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



const selectAllAccountNotification = async (fastify, request, reply) => {
	let query;
	const client = fastify.postgresql.client

	with (decodeUrlObject(request.query)) {
		query = {
			text: 	'select * from notification.find_all_account_notification(\n' +
					'	$1, $2, $3, $4\n' +
					');',
			values: [
				ID, receiverAID, notificationID, status
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