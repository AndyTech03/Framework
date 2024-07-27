const fs = require('fs')

const mkDir = (dirName) => {
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName, { recursive: true })
 	}
}

const getSerialType_orDefault = (type) => {
	if (type.includes('serial') == false)
		return type
	switch (type) {
		case 'bigserial':
			return 'bigint'
		case 'serial':
			return 'integer'
		case 'smallserial':
			return 'smallint'
		default:
			throw `Unknown serial type '${type}'`
	}
}

const getDateTimeString = (date = undefined) => {
	if (date === undefined)
		date = new Date()
	return date.toISOString().split('.')[0] + 'Z'
}

const getColumnMockValue = (column) => {
	const type = getSerialType_orDefault(column.type)
	switch (type) {
		case 'bigint':
		case 'integer':
		case 'smallint':
			return 1
		case 'text':
			return 'SomeText'
		case 'json':
			return '{"data": "text"}'
		case 'timestamp without time zone':
			return getDateTimeString()
		default:
			return type
	}
}

const columns_toJson = (columns) => 
	JSON.stringify(
		columns.reduce((result, column, i) => 
			({...result, [column.jsName]: getColumnMockValue(column)}), {}
		), 
		null, '\t'
	)

const capitalizeName = (name) => name[0].toUpperCase() + name.slice(1)

const decodeUrlObject = (obj) => {
	const entries = Object.keys(obj).map(
		key => ({[key]: decodeURIComponent(obj[key])})
	)
	return Object.assign({}, ...entries)
}

const pgRow_to_jsObject = (pgRow, jsKeys) => {
	const entries = Object.keys(pgRow).map(
		key => ({[jsKeys[key]]: pgRow[key]})
	)
	return Object.assign({}, ...entries)
}

const generate = () => {
	const model = JSON.parse(fs.readFileSync('model.json').toString())
	let insomniaData = { 
		__export_format: 4, 
		resources: [
			{
				_id: 'wrk_1',
				_type: 'workspace',
				name: 'Prologue Back-end API',
				description: 'Prologue Back-end API',
				scope: 'collection'
			},
			{
				_id: 'env_1',
				_type: 'environment',
				parentId: 'wrk_1',
				name: 'Base Environment',
				data: {
					host: 'localhost:5000'
				},
				dataPropertyOrder: {
					'&': [
						'host'
					]
				},
				color: null,
				isPrivate: false
			},
			{
				_id: 'jar_1',
				type: 'cookie_jar',
				parentId: 'wrk_1',
				name: 'Default Jar',
				cookies: []
			}
		] 
	}
	let req_id = 1
	let fld_id = 1
	let pair_id = 1
	let foreignKeys = []

	// Create root-dirs
	mkDir('./src/doc')
	mkDir('./src/pgsql')
	mkDir('./src/routes')
	mkDir('./src/tests')
	mkDir('./src/utils')

	const foreignKeysFile = fs.createWriteStream(`./src/pgsql/foreignKeys.pg.sql`)
	const insomniaFile = fs.createWriteStream(`./src/doc/!Insomnia.json`)
	const utilsFile = fs.createWriteStream(`./src/utils/generated.js`)
	const utilsFuncs = [pgRow_to_jsObject, decodeUrlObject]
	utilsFile.write(
		utilsFuncs.map(
			func => `const ${func.name} = ${func}`
		).join('\n\n') + `\n` +
		`\n\n` +
		`module.exports = {\n` +
		utilsFuncs.map(
			func => `	${func.name}`
		).join(',\n') + `\n` +
		`}\n\n`
	)
	const schemas = model.schemas.sort((a, b) => 
		a.pgName > b.pgName
	)
	for (const schema of schemas){
		const schemaFldId = `fld_${fld_id++}`
		const schemaName = schema.name
		const tablesJsNames = schema.tables.map(t => t.jsName) // Need to fill root files before Main loop

		// Save roots
		const pgModuleDir = `./src/pgsql/${schemaName}/generated`
		const routeModuleDir = `./src/routes/${schemaName}/generated`
		const testModuleDir = `./src/tests/${schemaName}/generated`
		
		// Create sub-dirs
		mkDir(pgModuleDir)
		mkDir(routeModuleDir)
		mkDir(testModuleDir)
		
		// Init root file streams
		const schemaTablesFile = fs.createWriteStream(`./src/pgsql/${schemaName}/tables.pg.sql`)
		const schemaRouterFile = fs.createWriteStream(`./src/routes/${schemaName}/router.js`)
		const schemaTestFile = fs.createWriteStream(`./src/tests/${schemaName}/generatedTests.js`)

		// Head tables.pg.sql
		schemaTablesFile.write(
			`drop schema if exists ${schemaName} cascade;\n` +
			`create schema ${schemaName};\n` +
			`\n\n`
		)
		// Fill router.js
		schemaRouterFile.write(
			tablesJsNames.map(
				name => `const ${name}Routes = require('./generated/${name}')\n`
			).join('') +
			'\n\n' +
			`const ${schemaName}Router = (fastify, _, done) => {\n` +
			tablesJsNames.map(
				name => `	${name}Routes(fastify)\n`
			).join('') +
			'\n' +
			`	done()\n` +
			`}\n` +
			'\n\n' +
			`module.exports = ${schemaName}Router`
		)
		// Fill generatedTests.js
		schemaTestFile.write(
			`const { test } = require('tap')\n` +
			`const { buildApp } = require('../app')\n` +
			'\n' +
			tablesJsNames.map(
				name => `const ${name}Tests = require('./generated/${name}')\n`
			).join('') +
			'\n\n' +
			`const tests = {\n` +
			tablesJsNames.map(
				name => `	${name}: true,\n`
			).join('') +
			'}\n' +
			'\n\n' +
			`const ${schemaName}Tests = (parentTest) => {\n` +
			
			tablesJsNames.map(
				name => 
					`	test(\n` +
					`		'${schemaName}.${name}', { only: tests.${name} },\n` +
					`		async (t) => {\n` +
					`			const app = await buildApp()\n` +
					`			t.teardown(_ => app.close())\n\n` +
					`			${name}Tests(parentTest, t, app)\n` +
					`		}\n` +
					`	)\n`
			).join('') +
			`}\n` +
			'\n\n' +
			`module.exports = ${schemaName}Tests`
		)
		
		{	// insomniaData
			insomniaData.resources.push({
				_id: schemaFldId,
				_type: `request_group`,
				parentId: `wrk_1`,
				name: capitalizeName(schemaName),
				description: `Folder of schema ${schemaName}`
			})
		}

		// Main loop
		for (const table of schema.tables) {
			const tableFldId = `fld_${fld_id++}`
			const tablePgName = table.pgName
			const tableLowerCaseName = tablePgName.toLowerCase()
			const tableJsName = table.jsName
			const primaryKeys = table.primaryKeys || []
			const uniqueKeys = table.uniqueKeys || []

			let columns = []	// Columns spread between some arrays, need some stash

			// Init table file streams
			const tableQueriesFile = fs.createWriteStream(`${pgModuleDir}/${tableJsName}.pg.sql`)
			const tableRouterFile = fs.createWriteStream(`${routeModuleDir}/${tableJsName}.js`)
			const tableTestFile = fs.createWriteStream(`${testModuleDir}/${tableJsName}.js`)
			
			// Push to columns
			for (const primaryKey of primaryKeys) {
				columns.push(primaryKey)
			}
			// Push to columns and foreignKeys
			for (const foreignKey of table.foreignKeys || []) {
				foreignKeys.push({
					schemaName, tablePgName,
					...foreignKey
				})

				for (const column of foreignKey.columns) {
					columns.push(column)
				}
			}
			// Push to columns
			for (const column of table.columns || []) {
				columns.push(column)
			}

			const insertArgs = columns.filter(
				column => (
						column.default == undefined ||				// NOT has some default value
						primaryKeys.includes(column)				// or is primary key 
				 	) && column.type.includes('serial') == false	// and NOT serial type
			)
			const primaryNotArgs = primaryKeys.filter(
				column => insertArgs.includes(column) == false
			)
			const primarySerial = primaryKeys.filter(
				column => column.type.includes('serial')
			)
			const primaryOrArgs = columns.filter(
				column => 
					primaryKeys.includes(column) ||
					insertArgs.includes(column)
			)
			const notPrimary = columns.filter(
				column => primaryKeys.includes(column) == false
			)
			
			{	// PGSQL
				// Fill table in tables.pg.sql
				schemaTablesFile.write(
					`create table ${schemaName}.${tablePgName}(` + (
						columns != false ? (
							(
								`\n` + 
								columns.map(
									column => 
										`	${column.pgName} ${column.type} not null` + (
												column.default != undefined
													? ` default ${column.default}` 
													: ''
											) + `,\n`
								).join('') + 
								`\n` + (
									primaryKeys != false ? ( 
										`	primary key (` +
										primaryKeys.map(
											column => column.pgName
										).join(', ') +
										`),\n`
									) : '' 
								) + (
									uniqueKeys != false ? (
										uniqueKeys.map(
											key => 
												`	unique (` +
												key.columnsPgNames.join(', ') +
												`),\n`
										).join('')
									) : '' 
								)
							).slice(0, -2) +
							`\n`
						) : ``
					) + 
					`);\n\n`
				)

				// Add Create function
				if (table.createScript) {
					tableQueriesFile.write(
						`create or replace function\n` +
						`${schemaName}.create_${tableLowerCaseName}(` + (
							insertArgs != false ? (
								`\n` +
								insertArgs.map(
									column => `	_${column.pgName} ${column.type}`
								).join(`,\n`) +
								`\n`
							) : ``
						) +
						`)\n` +
						`returns ` + (
							primaryKeys != false ? (
								`table(` +
								primaryKeys.map(
									column => `${column.pgName} ${getSerialType_orDefault(column.type)}`
								).join(', ') +
								`)`
							) : `void`
						) +
						`\n` + 
						`language plpgsql as $$\n` + (
							primaryNotArgs != false ? (
								`declare\n` +
								primaryNotArgs.map(
									column => `	_${column.pgName} ${getSerialType_orDefault(column.type)};\n`
								).join('')
							) : ``
						) +
						`begin\n` + (
							primarySerial != false ? (
								primarySerial.map(
									column => 
										`	_${column.pgName} := nextval(pg_get_serial_sequence(` +
										`'${schemaName}.${tablePgName}', '${column.pgName}'));\n`
								).join('') + `\n`
							) : ``
						) + (
							primaryOrArgs != false ? (
								`	return query insert into ${schemaName}.${tablePgName} (\n` + 
								`		` +
								primaryOrArgs.map(
									column => `${column.pgName}`
								).join(', ') +
								`\n	) values (\n` +
								`		` +
								primaryOrArgs.map(
									column => `_${column.pgName}`
								).join(', ') +
								`\n	)` + (
									primaryKeys != false ? (
										` returning ` +
										primaryKeys.map(
											column => `${tablePgName}.${column.pgName}`
										).join(', ')
									) : ``
								) + `;\n`
							) : `	-- Nothing to insert...`
						) +
						`	return;\n` +
						`end;\n` +
						`$$;\n` +
						`\n`
					)
				}

				// Add Read (select) function
				if (table.readScript) {
					tableQueriesFile.write(
						`create or replace function\n` +
						`${schemaName}.select_${tableLowerCaseName}(` + (
							primaryKeys != false ? (
								`\n` +
								primaryKeys.map(
									column => `	_${column.pgName} ${getSerialType_orDefault(column.type)}`
								).join(`,\n`) +
								`\n`
							) : ``
						) +
						`)\n` +
						`returns ${schemaName}.${tablePgName}\n` +
						`language plpgsql as $$\n` +
						`begin\n` + (
							primaryKeys != false ? (
								`	perform debug.not_found_handler(\n` +
								`		'${schemaName}.${tablePgName}', exists(\n` +
								`			select from ${schemaName}.${tablePgName}\n` +
								`			where\n` +
								primaryKeys.map(
									column => `				${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`\n		), json_build_object(\n` +
								primaryKeys.map(
									column => `			'_${column.pgName}', _${column.pgName}`
								).join(`,\n`) + 
								`\n		)\n` +
								`	);\n\n` +
								`	return (\n` +
								`		select ${tablePgName}\n` +
								`		from ${schemaName}.${tablePgName}\n` +
								`		where\n` +
								primaryKeys.map(
									column => `			${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`\n	);\n`
							) : (
								`	-- Can't read with out of primary keys!\n` +
								`	return null;\n`
							)
						) +
						`end;\n` +
						`$$;\n` +
						`\n`
					)
				}
				
				// Add Update procedure
				if (table.updateScript) {
					tableQueriesFile.write(
						`create or replace procedure\n` +
						`${schemaName}.update_${tableLowerCaseName}(` + (
							columns != false ? (
								`\n` +
								columns.map(
									column => (
										primaryKeys.includes(column) ? (
											`	_${column.pgName} ${getSerialType_orDefault(column.type)}`
										) : (
											`	_${column.pgName} ${getSerialType_orDefault(column.type)}` + 
											` default null`
										)
									)
								).join(`,\n`) +
								`\n`
							) : ``
						) +
						`)\n` +
						`language plpgsql as $$\n` +
						`begin\n` + (
							notPrimary != false ? (
								`	perform debug.not_found_handler(\n` +
								`		'${schemaName}.${tablePgName}', exists(\n` +
								`			select from ${schemaName}.${tablePgName}\n` +
								`			where\n` +
								primaryKeys.map(
									column => `				${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`\n		), json_build_object(\n` +
								primaryKeys.map(
									column => `			'_${column.pgName}', _${column.pgName}`
								).join(`,\n`) + 
								`\n		)\n` +
								`	);\n\n` +
								`	update ${schemaName}.${tablePgName} set\n` +
								notPrimary.map(
									column => `		${column.pgName} = coalesce(_${column.pgName}, ${column.pgName})`
								).join(`,\n`) +
								`\n	where\n` +
								primaryKeys.map(
									column => `		${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`;\n`
							) : `	-- Nothing to update!\n`
						) +
						`end;\n` +
						`$$;\n` +
						`\n`
					)
				}

				// Add Delete procedure
				if (table.deleteScript) {
					tableQueriesFile.write(
						`create or replace procedure\n` +
						`${schemaName}.delete_${tableLowerCaseName}(` + (
							primaryKeys != false ? (
								`\n` +
								primaryKeys.map(
									column => `	_${column.pgName} ${getSerialType_orDefault(column.type)}`
								).join(`,\n`) +
								`\n`
							) : ``
						) +
						`)\n` +
						`language plpgsql as $$\n` +
						`begin\n` + (
							primaryKeys != false ? (
								`	perform debug.not_found_handler(\n` +
								`		'${schemaName}.${tablePgName}', exists(\n` +
								`			select from ${schemaName}.${tablePgName}\n` +
								`			where\n` +
								primaryKeys.map(
									column => `				${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`\n		), json_build_object(\n` +
								primaryKeys.map(
									column => `			'_${column.pgName}', _${column.pgName}`
								).join(`,\n`) + 
								`\n		)\n` +
								`	);\n\n` +
								`	delete from ${schemaName}.${tablePgName} where\n` +
								primaryKeys.map(
									column => `		${column.pgName} = _${column.pgName}`
								).join(` and\n`) +
								`;\n`
							) : `	-- Can't delete with out of primary keys!\n`
						) +
						`end;\n` +
						`$$;\n` +
						`\n`
					)
				}

				// Add Selec All function
				if (table.selectAllScript) {
					tableQueriesFile.write(
						`create or replace function\n` +
						`${schemaName}.find_all_${tableLowerCaseName}(` + (
							columns != false ? (
								`\n` +
								columns.map(
									column => 
										`	_${column.pgName} text` +
										` default ''`
								).join(`,\n`) +
								`\n`
							) : ``
						) +
						`)\n` +
						`returns setof ${schemaName}.${tablePgName}\n` +
						`language plpgsql as $$\n` +
						`begin\n` + (
							columns != false ? (
								`	return query select *\n` +
								`		from ${schemaName}.${tablePgName}\n` +
								`		where\n` +
								columns.map(
									column => `			(_${column.pgName} is null or _${column.pgName} = '' or (${column.pgName}::text ~ ('^' || _${column.pgName} || '$')))`
								).join(` and\n`) +
								`;\n`
							) : (
								`	-- Nothing to select!\n` +
								`	return next null;\n`
							)
						) +
						`end;\n` +
						`$$;\n` +
						`\n`
					)
				}
			}
			{	// Fastify.js
				tableRouterFile.write(
					`const { errorsHandler } = require('../../../errors')\n` +
					`const { pgRow_to_jsObject, decodeUrlObject } = require('../../../utils/generated')` +
					`\n\n` +
					`const routes = (fastify) => {\n\t` + (
						[
							(
								table.createScript ? (
									`	fastify.post('/${tableJsName}', async (request, reply) =>\n` +
									`		create${capitalizeName(tableJsName)}(\n` +
									`			fastify, request, reply\n` +
									`	))\n`
								) : ``
							),
							(
								table.readScript ? (
									`	fastify.get('/${tableJsName}', async (request, reply) =>\n` +
									`		read${capitalizeName(tableJsName)}(\n` +
									`			fastify, request, reply\n` +
									`	))\n`
								) : ``
							),
							(
								table.updateScript ? (
									`	fastify.put('/${tableJsName}', async (request, reply) =>\n` +
									`		update${capitalizeName(tableJsName)}(\n` +
									`			fastify, request, reply\n` +
									`	))\n`
								) : ``
							),
							(
								table.deleteScript ? (
									`	fastify.delete('/${tableJsName}', async (request, reply) =>\n` +
									`		delete${capitalizeName(tableJsName)}(\n` +
									`			fastify, request, reply\n` +
									`	))\n`
								) : ``
							),
							`\n`,
							(
								table.selectAllScript ? (
									`	fastify.get('/${tableJsName}/getAll', async (request, reply) =>\n` +
									`		selectAll${capitalizeName(tableJsName)}(\n` +
									`			fastify, request, reply\n` +
									`	))\n`
								) : ``
							)
						].filter(s => s != '').join('\n').trim()
					) + 
					`\n}\n` + 
					`\n\n` +
					(
						[
							(
								table.createScript ? (
									`const create${capitalizeName(tableJsName)} = async (fastify, request, reply) => {\n` +
									`	let createQuery;\n` +
									`	const client = fastify.postgresql.client\n` +
									`\n` +
									`	with (request.body) {\n` +
									`		createQuery = {\n` +
									`			text: 	'select * from ${schemaName}.create_${tableLowerCaseName}(\\n' +\n` +
									`					'	` +
									insertArgs.map(
										(column, index) => `$${index + 1}::${getSerialType_orDefault(column.type)}`
									).join(`, `) + `\\n' +\n` +
									`					');',\n` +
									`			values: [\n` +
									`				` +
									insertArgs.map(
										column => `${column.jsName}`
									).join(`, `) + `\n` +
									`			]\n` +
									`		}\n` +
									`	}\n` +
									`\n` +
									`	client.query(\n` +
									`		createQuery\n` +
									`	).then((result) =>\n` +
									`		reply.send(result.rows[0])\n` +
									`	).then((row) =>\n` +
									`		pgRow_to_jsObject(row, {\n` +
									insertArgs.map(
										column => `			${column.pgName}: '${column.jsName}'`
									).join(',\n') + `\n` +
									`	})).catch(error =>\n` +
									`		errorsHandler(reply, error)\n` +
									`	)\n` +
									`\n` +
									`	return reply\n` +
									`}\n`
								) : ``
							),
							(
								table.readScript ? (
									`const read${capitalizeName(tableJsName)} = async (fastify, request, reply) => {\n` +
									`	let readQuery;\n` +
									`	const client = fastify.postgresql.client\n` +
									`\n` +
									`	with (request.query) {\n` +
									`		readQuery = {\n` +
									`			text: 	'select * from ${schemaName}.select_${tableLowerCaseName}(\\n' +\n` +
									`					'	` +
									primaryKeys.map(
										(column, index) => `$${index + 1}::${getSerialType_orDefault(column.type)}`
									).join(`, `) + `\\n' +\n` +
									`					');',\n` +
									`			values: [\n` +
									`				` +
									primaryKeys.map(
										column => `${column.jsName}`
									).join(`, `) + `\n` +
									`			]\n` +
									`		}\n` +
									`	}\n` +
									`\n` +
									`	client.query(\n` +
									`		readQuery\n` +
									`	).then((result) =>\n` +
									`		reply.send(result.rows[0])\n` +
									`	).then((row) =>\n` +
									`		pgRow_to_jsObject(row, {\n` +
									primaryKeys.map(
										column => `			${column.pgName}: '${column.jsName}'`
									).join(',\n') + `\n` +
									`	})).catch(error =>\n` +
									`		errorsHandler(reply, error)\n` +
									`	)\n` +
									`\n` +
									`	return reply\n` +
									`}\n`
								) : ``
							),
							(
								table.updateScript ? (
									`const update${capitalizeName(tableJsName)} = async (fastify, request, reply) => {\n` +
									`	let updateQuery;\n` +
									`	const client = fastify.postgresql.client\n` +
									`\n` +
									`	with (request.body) {\n` +
									`		updateQuery = {\n` +
									`			text: 	'call ${schemaName}.update_${tableLowerCaseName}(\\n' +\n` +
									`					'	` +
									columns.map(
										(column, index) => `$${index + 1}::${getSerialType_orDefault(column.type)}`
									).join(`, `) + `\\n' +\n` +
									`					');',\n` +
									`			values: [\n` +
									`				` +
									columns.map(
										column => `${column.jsName}`
									).join(`, `) + `\n` +
									`			]\n` +
									`		}\n` +
									`	}\n` +
									`\n` +
									`	client.query(\n` +
									`		updateQuery\n` +
									`	).then((result) =>\n` +
									`		reply.send('OK')\n` +
									`	).catch(error =>\n` +
									`		errorsHandler(reply, error)\n` +
									`	)\n` +
									`\n` +
									`	return reply\n` +
									`}\n`
								) : ``
							),
							(
								table.updateScript ? (
									`const delete${capitalizeName(tableJsName)} = async (fastify, request, reply) => {\n` +
									`	let deleteQuery;\n` +
									`	const client = fastify.postgresql.client\n` +
									`\n` +
									`	with (request.body) {\n` +
									`		deleteQuery = {\n` +
									`			text: 	'call ${schemaName}.delete_${tableLowerCaseName}(\\n' +\n` +
									`					'	` +
									primaryKeys.map(
										(column, index) => `$${index + 1}::${getSerialType_orDefault(column.type)}`
									).join(`, `) + `\\n' +\n` +
									`					');',\n` +
									`			values: [\n` +
									`				` +
									primaryKeys.map(
										column => `${column.jsName}`
									).join(`, `) + `\n` +
									`			]\n` +
									`		}\n` +
									`	}\n` +
									`\n` +
									`	client.query(\n` +
									`		deleteQuery\n` +
									`	).then((result) =>\n` +
									`		reply.send('OK')\n` +
									`	).catch(error =>\n` +
									`		errorsHandler(reply, error)\n` +
									`	)\n` +
									`\n` +
									`	return reply\n` +
									`}\n`
								) : ``
							),
							`\n`,
							(
								table.selectAllScript ? (
									`const selectAll${capitalizeName(tableJsName)} = async (fastify, request, reply) => {\n` +
									`	let query;\n` +
									`	const client = fastify.postgresql.client\n` +
									`\n` +
									`	with (decodeUrlObject(request.query)) {\n` +
									`		query = {\n` +
									`			text: 	'select * from ${schemaName}.find_all_${tableLowerCaseName}(\\n' +\n` +
									`					'	` +
									columns.map(
										(column, index) => `$${index + 1}`
									).join(`, `) + `\\n' +\n` +
									`					');',\n` +
									`			values: [\n` +
									`				` +
									columns.map(
										column => `${column.jsName}`
									).join(`, `) + `\n` +
									`			]\n` +
									`		}\n` +
									`	}\n` +
									`	console.log(query)\n` +
									`\n` +
									`	client.query(\n` +
									`		query\n` +
									`	).then((result) =>\n` +
									`		result.rows\n` +
									`	).then((rows) =>\n` +
									`		rows.map((row) =>\n` +
									`			pgRow_to_jsObject(row, {\n` +
									primaryKeys.map(
										column => `				${column.pgName}: '${column.jsName}'`
									).join(',\n') + `\n` +
									`	}))).then((result) =>\n` +
									`		reply.send(result)` +
									`	).catch(error =>\n` +
									`		errorsHandler(reply, error)\n` +
									`	)\n` +
									`\n` +
									`	return reply\n` +
									`}\n`
								) : ``
							)
						].filter(s => s != '').join('\n').trim()
					) + `\n` +
					`\n\n` +
					`module.exports = routes`
				)
			}
			{	// insomniaData
				insomniaData.resources.push({
					_id: tableFldId,
					_type: `request_group`,
					parentId: schemaFldId,
					name: capitalizeName(tableJsName),
					description: `Folder of table ${tablePgName} of schema ${schemaName}`
				})
				insomniaData.resources = insomniaData.resources.concat(
					[
						(
							table.createScript ? (
								{
									_id: `req_${req_id++}`,
									_type: 'request',
									parentId: tableFldId,
									name: `Create ${capitalizeName(tableJsName)}`,
									description: `Call insert function, returning primary keys`,
									method: `post`,
									url: `{{_.host}}/${schemaName}/${tableJsName}`,
									body: {
										mimeType: `application/json`,
										text: columns_toJson(insertArgs)
									},
									headers: [
										{
											name: "Content-Type",
											value: "application/json"
										},
										{
											name: 'User-Agent',
											value: 'insomnia/9.3.2'
										}
									]
								}
							) : null
						),
						(
							table.readScript ? (
								{
									_id: `req_${req_id++}`,
									_type: 'request',
									parentId: tableFldId,
									name: `Read ${capitalizeName(tableJsName)}`,
									description: `Call select function, returning all columns`,
									method: `get`,
									url: `{{_.host}}/${schemaName}/${tableJsName}`,
									body: {},
									parameters: primaryKeys.map(
										column => ({
											id: `pair_${pair_id++}`,
											name: column.jsName,
											value: getColumnMockValue(column).toString(),
											description: '',
											disabled: false
										})
									),
									headers: [
										{
											name: 'User-Agent',
											value: 'insomnia/9.3.2'
										}
									]
								}
							) : null
						),
						(
							table.updateScript ? (
								{
									_id: `req_${req_id++}`,
									_type: 'request',
									parentId: tableFldId,
									name: `Update ${capitalizeName(tableJsName)}`,
									description: `Call update procedure, returning 'OK' message`,
									method: `put`,
									url: `{{_.host}}/${schemaName}/${tableJsName}`,
									body: {
										mimeType: `application/json`,
										text: columns_toJson(columns)
									},
									headers: [
										{
											name: "Content-Type",
											value: "application/json"
										},
										{
											name: 'User-Agent',
											value: 'insomnia/9.3.2'
										}
									]
								}
							) : null
						),
						(
							table.deleteScript ? (
								{
									_id: `req_${req_id++}`,
									_type: 'request',
									parentId: tableFldId,
									name: `Delete ${capitalizeName(tableJsName)}`,
									description: `Call delete procedure, returning 'OK' message`,
									method: `delete`,
									url: `{{_.host}}/${schemaName}/${tableJsName}`,
									body: {
										mimeType: `application/json`,
										text: columns_toJson(primaryKeys)
									},
									headers: [
										{
											name: "Content-Type",
											value: "application/json"
										},
										{
											name: 'User-Agent',
											value: 'insomnia/9.3.2'
										}
									]
								}
							) : null
						),
						(
							table.selectAllScript ? (
								{
									_id: `req_${req_id++}`,
									_type: 'request',
									parentId: tableFldId,
									name: `Find ${capitalizeName(tableJsName)}`,
									description: `Call FindAll function, returning array of json`,
									method: `get`,
									url: `{{_.host}}/${schemaName}/${tableJsName}/getAll`,
									body: {},
									parameters: columns.map(
										column => ({
											id: `pair_${pair_id++}`,
											name: column.jsName,
											value: getColumnMockValue(column).toString(),
											description: '',
											disabled: false
										})
									),
									headers: [
										{
											name: "Content-Type",
											value: "application/json"
										},
										{
											name: 'User-Agent',
											value: 'insomnia/9.3.2'
										}
									]
								}
							) : null
						)
					].filter(r => r != null).reverse()
				)

			}
		}
	}
	insomniaFile.write(JSON.stringify(insomniaData))
	foreignKeysFile.write(
		`do $$\n` +
		`declare\n` +
		`	r record;\n` +
		`begin\n` +
		`	for r in (\n` +
		`		select table_schema, table_name, constraint_name\n` +
		`		from information_schema.table_constraints\n` +
		`		where constraint_type = 'FOREIGN KEY'\n` +
		`	) loop\n` +
		`		raise info '%', 'dropping ' || r.constraint_name;\n` +
		`		execute concat(\n` +
		`			'alter table ', r.table_schema, '.', r.table_name,\n` +
		`			' drop constraint ', r.constraint_name\n` +
		`		);\n` +
		`	end loop;\n` +
		`end;\n` +
		`$$;\n` +
		`\n\n` +
		foreignKeys.map(
			key => 
				`alter table ${key.schemaName}.${key.tablePgName}\n`+
				`add constraint fkey_${key.schemaName}_${key.tablePgName}__${key.columns.map(c => c.pgName).join('__')}\n` +
				`foreign key (\n` +
				`	${key.columns.map(c => c.pgName).join(', ')}\n` +
				`) references ${key.reference.schema}.${key.reference.table} (\n` +
				`	${key.reference.columns.join(', ')}\n` +
				`);`
		).join('\n\n')
	)
	return model.toString()
}

module.exports = generate