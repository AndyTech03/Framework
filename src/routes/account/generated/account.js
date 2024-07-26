const { errorsHandler } = require('../../../errors')
const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')

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
			text: 	'select * from account.create_account(\n' +
					'	$1::smallint, $2::smallint, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, $9::timestamp without time zone\n' +
					');',
			values: [
				stateID, roleID, email, phone, password, name, secondName, lastName, birthday
			]
		}
	}

	client.query(
		createQuery
	).then((result) =>
		reply.send(result.rows[0])
	).then((row) =>
		pgRow_to_jsObject(row, {
			state_id: 'stateID',
			role_id: 'roleID',
			email: 'email',
			phone: 'phone',
			password: 'password',
			name: 'name',
			second_name: 'secondName',
			last_name: 'lastName',
			birthday: 'birthday'
	})).catch(error =>
		errorsHandler(reply, error)
	)

	return reply
}

const readAccount = async (fastify, request, reply) => {
	let readQuery;
	const client = fastify.postgresql.client

	with (request.query) {
		readQuery = {
			text: 	'select * from account.select_account(\n' +
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

const updateAccount = async (fastify, request, reply) => {
	let updateQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		updateQuery = {
			text: 	'call account.update_account(\n' +
					'	$1::bigint, $2::smallint, $3::smallint, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text, $10::timestamp without time zone, $11::timestamp without time zone\n' +
					');',
			values: [
				ID, stateID, roleID, email, phone, password, name, secondName, lastName, birthday, registrationDate
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

const deleteAccount = async (fastify, request, reply) => {
	let deleteQuery;
	const client = fastify.postgresql.client

	with (request.body) {
		deleteQuery = {
			text: 	'call account.delete_account(\n' +
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



const selectAllAccount = async (fastify, request, reply) => {
	let query;
	const client = fastify.postgresql.client

	with (decodeUrlObject(request.query)) {
		query = {
			text: 	'select * from account.find_all_account(\n' +
					'	$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11\n' +
					');',
			values: [
				ID, stateID, roleID, email, phone, password, name, secondName, lastName, birthday, registrationDate
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