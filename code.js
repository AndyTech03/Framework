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

const generate = () => {
	const model = JSON.parse(fs.readFileSync('model.json').toString())
	let foreignKeys = []
	let globalPrimaryKeys = []

	mkDir('./src')
	
	for (const schema of model.schemas){
		const schemaName = schema.name
		const tablesJsNames = schema.tables.map(t => t.jsName) // Need to fill root files before Main loop

		// Save roots
		const pgModuleDir = `./src/pgsql/${schemaName}/generated`
		const routeModuleDir = `./src/routes/${schemaName}/generated`
		const testModuleDir = `./src/tests/${schemaName}/generated`
		
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
			`const ${schemaName}Routes = (fastify, _, done) => {\n` +
			tablesJsNames.map(
				name => `	${name}Routes(fastify)\n`
			).join('') +
			'\n' +
			`	done()\n` +
			`}\n` +
			'\n\n' +
			`module.exports = ${schemaName}Routes`
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

		// Create sub-dirs
		mkDir(pgModuleDir)
		mkDir(routeModuleDir)
		mkDir(testModuleDir)

		// Main loop
		for (const table of schema.tables) {
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
			
			// Push to Globals
			if (table.globalPrimaryKeys) {
				globalPrimaryKeys.push({
					schemaName, tablePgName,
					primaryKeys: table.primaryKeys
				})
			}
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
									`	_${column.pgName} ${getSerialType_orDefault(column.type)}` +
									` default null`
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
								column => `			(_${column.pgName} is null or ${column.pgName} = _${column.pgName})`
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

	}
	console.log(foreignKeys)
	console.log(globalPrimaryKeys)
	return model.toString()
}

module.exports = generate