const { errorsHandler } = require('../../../errors')
const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')

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
			text: 	'select * from notification.create_account_notification_settings(\n' +
					'	$1::bigint, $2::json\n' +
					');',
			values: [
				accountID, settings
			]
		}
	}

	client.query(
		createQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			account_id: 'accountID',
			settings: 'settings'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const readAccountNotificationSettings = async (fastify, request, reply) => {
	let readQuery;
	const client = fastify.postgresql.client

	with (request.query) {
		readQuery = {
			text: 	'select * from notification.select_account_notification_settings(\n' +
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

const updateAccountNotificationSettings = async (fastify, request, reply) => {
	let updateQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		updateQuery = {
			text: 	'call notification.update_account_notification_settings(\n' +
					'	$1::bigint, $2::bigint, $3::json\n' +
					');',
			values: [
				ID, accountID, settings
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

const deleteAccountNotificationSettings = async (fastify, request, reply) => {
	let deleteQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		deleteQuery = {
			text: 	'call notification.delete_account_notification_settings(\n' +
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



const selectAllAccountNotificationSettings = async (fastify, request, reply) => {
	let query;
	const client = fastify.postgresql.client

	with (decodeUrlObject(request.query)) {
		query = {
			text: 	'select * from notification.find_all_account_notification_settings(\n' +
					'	$1, $2, $3\n' +
					');',
			values: [
				ID, accountID, settings
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