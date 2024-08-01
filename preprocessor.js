const { log } = require('console')
const fs = require('fs')


const generateSrc = (fileName) => {
	const model = JSON.parse(fs.readFileSync(fileName).toString())
	// #region Default values
	this.app = model.app || {}
	this.app = {
		name: this.app.name || 'Generated App Name',
		defaultOptions: this.app.defaultOptions || null,
		environments: this.app.environments || [],
		imports: this.app.imports || [],
		plugins: this.app.plugins || [],
		services: this.app.services || [],
	}
	// #endregion
	// #region Create root dirs
	this.rootPath = './result'
	this.srcPath = `${this.rootPath}/src`
	this.docPath = `${this.srcPath}/doc`
	this.pluginsPath = `${this.srcPath}/plugins`
	this.servicesPath = `${this.srcPath}/services`

	if (fs.existsSync(this.rootPath))
		fs.rmSync(this.rootPath, { recursive: true })
	mkDir(this.docPath)
	mkDir(this.pluginsPath)
	mkDir(this.servicesPath)
	// #endregion
	// #region Importing plugins
	for (const plugin of this.app.plugins) {
		fs.copyFileSync(
			`./plugins/${plugin.name}.js`,
			`${this.pluginsPath}/${plugin.name}.js`
		)
	}
	//#endregion
	// #region Importing utils
	fs.cpSync(
		`./utils`,
		`${this.rootPath}/utils`,
		{ recursive: true }
	)
	//#endregion
	// #region Create and Fill environments files
	for (const environment of this.app.environments) {
		const envFile = fs.createWriteStream(`${this.rootPath}/.env.${environment.name}`)
		envFile.write(
			Object.keys(environment.values).reduce((result, key) =>
				`${result}` +
				`${key} = '${environment.values[key]}'\n`,
				''
			)
		)
		envFile.close()
	}
	//#endregion
	// #region Create and Fill appFile
	const appFile = fs.createWriteStream(`${this.srcPath}/app.js`)
	appFile.write(
		`const Fastify = require('fastify').fastify\n` +
		`const router = require('./router')\n` +
		`\n` +
		`// Imports\n` +
		this.app.imports.concat(
			this.app.plugins
		).map(
			plugin => plugin.import
		).join('\n') + `\n` +
		`\n\n` +
		`const buildApp = async (options) => {\n` +
		`	process.title = '${this.app.name}'\n` +
		`	const app = Fastify(options || ` +
		objectToPrettyText(this.app.defaultOptions, 1) + `)\n` +
		`\n` +
		`	// Router\n` +
		`	app.register(router)\n` +
		`\n` +
		`	// Imports\n` +
		this.app.imports.concat(
			this.app.plugins
		).map(
			plugin => (
				`	app.register(${plugin.name}` + (
					plugin.options ? (
						`, ` +
						objectToPrettyText(plugin.options, 1)
					) : ``
				) +
				`)`
			)
		).join('\n') + `\n` +
		`	return app\n` +
		`}\n` +
		`\n\n` +
		`module.exports = buildApp`
	)
	appFile.close()
	//#endregion
	// #region Create and Fill serverFile
	const serverFile = fs.createWriteStream(`${this.srcPath}/server.js`)
	serverFile.write(
		`const buildApp = require('./app')\n` +
		`const configEnv = require('dotenv').config\n` +
		`\n` +
		`const start = async () => {\n` +
		`	configEnv({path: \`.env.\${process.env.env}\`})\n` +
		`	const app = await buildApp()\n` +
		`	app.listen({ port: process.env.PORT || 5000 },\n` +
		`		(err, address) => {\n` +
		`			if (err) {\n` +
		`				console.log(err)\n` +
		`				process.exit(1)\n` +
		`			}\n` +
		`			app.log.info(\`Server listening on \${address}\`)\n` +
		`		}\n` +
		`	)\n` +
		`}\n` +
		`\n` +
		`start()`
	)
	serverFile.close()
	//#endregion
	for (let service of this.app.services) {
		// #region Default values
		service.schema = {
			pgName: service.schema,
			camelCaseName: camelCaseName(service.schema),
			PascalCaseName: PascalCaseName(service.schema),
		}
		service.pgName = service.name
		service.camelCaseName = service.camelCaseName || camelCaseName(service.name)
		service.PascalCaseName = service.PascalCaseName || PascalCaseName(service.name)
		
		service.templates = service.templates || []
		service.tables = service.tables || []
		service.tableAdapters = service.tableAdapters || []
		//#endregion
		// #region Create service dirs
		service.rootPath = `${this.servicesPath}/${service.camelCaseName}`

		mkDir(service.rootPath)
		//#endregion
		for (let table of service.tables) {
			// #region Default values
			table.schema = service.schema

			table.pgName = table.name
			table.camelCaseName = table.camelCaseName || camelCaseName(table.name)
			table.PascalCaseName = table.PascalCaseName || PascalCaseName(table.name)
			
			table.primaryKeys = table.primaryKeys || []
			table.foreignKeys = table.foreignKeys || []
			table.foreignArrayKeys = table.foreignArrayKeys || []
			table.uniqueKeys = table.uniqueKeys || []
			
			table.columns = table.columns || []
			//#endregion
			for (let column of table.columns) {
				// #region Default values
				column.pgName = column.name
				column.camelCaseName = column.camelCaseName || camelCaseName(column.name)
				column.PascalCaseName = column.PascalCaseName || PascalCaseName(column.name)
				column.dataType = column.dataType || getColumnDataType(column)
				column.flags = {
					editable: (column.nonEditable || false) == false,
					primaryKey: table.primaryKeys.includes(column.name),
					foreignKey: table.foreignKeys.some((key) => key.columns.includes(column.name)),
					foreignArrayKey: table.foreignArrayKeys.some((key) => key.arrayColumn == column.name),
					uniqueKey: table.uniqueKeys.some((key) => key.includes(column.name)),
					array: column.type.match('array|[]') != null,
					serial: column.type.includes('serial'),
					hasOnUpdate: column.onUpdate != undefined,
					hasDefault: column.default != undefined,
				}
				//#endregion
			}
			// #region Filter columns
			table.primaryKeysColumns = table.columns.filter(
				column => column.flags.primaryKey
			)
			//#endregion
		}
		for (let adapter of service.adapters) {
			// #region Default values
			adapter.schema = service.schema
			
			adapter.pgName = adapter.name
			adapter.camelCaseName = adapter.camelCaseName || camelCaseName(adapter.name)
			adapter.PascalCaseName = adapter.PascalCaseName || PascalCaseName(adapter.name)
			//#endregion
			// #region Create adapter dir
			adapter.rootPath = `${service.rootPath}/${adapter.camelCaseName}`
	
			mkDir(adapter.rootPath)
			//#endregion
			// #region Create and Fill queriesFile
			const queriesFile = fs.createWriteStream(`${adapter.rootPath}/queries.js`)
			queriesFile.write(
				``
			)
			queriesFile.close()
			//#endregion
			// #region Create and Fill adapterFile
			const adapterFile = fs.createWriteStream(`${adapter.rootPath}/adapter.js`)
			adapterFile.write(
				`const adapter = (fastify, options, done) => {\n` +
				`	done()\n` +
				`}\n` +
				`\n\n` +
				`module.exports = adapter`
			)
			adapterFile.close()
			//#endregion
			// #region Create and Fill testsFile
			const testsFile = fs.createWriteStream(`${adapter.rootPath}/tests.test.js`)
			testsFile.write(
				`const tests = (parentTest) => {\n` +
				`}\n` +
				`\n\n` +
				`module.exports = tests`
			)
			testsFile.close()
			//#endregion
		}
		// #region Create and Fill tablesFile 
		const tablesFile = fs.createWriteStream(`${service.rootPath}/tables.pg.sql`)
		tablesFile.write(
			`drop schema if exists ${service.schema.pgName} cascade;\n` +
			`create schema ${service.schema.pgName};\n` +
			`\n\n` +
			service.tables.map((table) =>
				`create table ${service.schema.pgName}.${table.pgName} (` +
				[
					table.columns.map((column) => 
					`\n	${column.pgName} ${column.type} not null` + (
						column.flags.hasDefault ? (
							`\n		default ${column.default}`
						) : '')
					).join(','),
					[
						`	primary key (` +
						table.primaryKeys.join(', ') + `)`,
					].concat(
						table.uniqueKeys.map((key) =>
							`	unique (${key.join(', ')})`
					)).join(',\n')
				].join(',\n\n') +
				`\n);`
			).join('\n\n')
		)
		tablesFile.close()
		//#endregion
		// #region Create and Fill routerFile 
		const routerFile = fs.createWriteStream(`${service.rootPath}/router.js`)
		routerFile.write(
			service.adapters.map((adapter) => 
				`const ${adapter.camelCaseName}Adapter = require('./${adapter.camelCaseName}/adapter')`
			).join('\n') + `\n` +
			`\n\n` +
			`const router = (fastify, options, done) => {\n` +
			service.adapters.map((adapter) => 
				`	fastify.register(${adapter.camelCaseName}Adapter, { prefix: '${adapter.camelCaseName}' })`
			).join('\n') + `\n` +
			`\n` +
			`	done()\n` +
			`}\n` +
			`\n\n` +
			`module.exports = router`
		)
		routerFile.close()
		//#endregion
		// #region Create and Fill testsFile 
		const testsFile = fs.createWriteStream(`${service.rootPath}/tests.test.js`)
		testsFile.write(
			service.adapters.map((adapter) => 
				`const ${adapter.camelCaseName}Tests = require('./${adapter.camelCaseName}/tests.test')`
			).join('\n') + `\n` +
			`\n\n` +
			`const tests = (parentTest) => {\n` +
			service.adapters.map((adapter) => 
				`	${adapter.camelCaseName}Tests(parentTest)\n`
			).join('\n') + `\n` +
			`}\n` +
			`\n\n` +
			`module.exports = tests`
		)
		testsFile.close()
		//#endregion
	}
	// #region Create and Fill foreignKeysFile 
	const foreignKeysFile = fs.createWriteStream(`${this.rootPath}/foreignKeys.pg.sql`)
	foreignKeysFile.write(
		[
			`-- Delete All Foreign Keys\n` +
			`do $$\n` +
			`declare\n` +
			`	r record;\n` +
			`begin\n` +
			`	for r in (\n` +
			`		select table_schema, table_name, constraint_name\n` +
			`		from information_schema.table_constraints\n` +
			`		where constraint_type = 'FOREIGN KEY' or\n` +
			`		(constraint_type = 'CHECK' and constraint_name like 'array_fkey%')\n` +
			`	) loop\n` +
			`		raise info '%', 'dropping ' || r.constraint_name;\n` +
			`		execute concat(\n` +
			`			'alter table ', r.table_schema, '.', r.table_name,\n` +
			`			' drop constraint ', r.constraint_name\n` +
			`		);\n` +
			`	end loop;\n` +
			`end;\n` +
			`$$;`,
			...this.app.services.map((service) => 
				`--	--	Service ${service.pgName}\n` +
				service.tables.map((table) =>
					`--	Table ${table.schema.pgName}.${table.pgName}\n` +
					table.foreignKeys.map((key) =>
						`alter table ${table.schema.pgName}.${table.pgName}\n`+
						`add constraint fkey_${table.schema.pgName}_${table.pgName}__${
							key.columns.join('__')
						}\n` +
						`foreign key (\n` +
						`	${key.columns.join(', ')}\n` +
						`) references ${key.reference.schema}.${key.reference.table} (\n` +
						`	${key.reference.columns.join(', ')}\n` +
						`);`
					).concat(
						table.foreignArrayKeys.map((arrayKey) =>
							`alter table ${table.schema.pgName}.${table.pgName}\n`+
							`add constraint array_fkey_${table.schema.pgName}_${table.pgName}__` +
							`${arrayKey.arrayColumn} check (\n` +
							`	test.array_fkey_chech(${arrayKey.arrayColumn}::text, ` +
							`'${arrayKey.reference.schema}.${arrayKey.reference.table}', '${arrayKey.reference.column}')\n` +
							`);`
						)
					).join('\n')
				).join('\n\n')
			)
		].join('\n\n\n')
	)
	foreignKeysFile.close()
	//#endregion
	// #region Create and Fill routerFile
	const routerFile = fs.createWriteStream(`${this.srcPath}/router.js`) 
	routerFile.write(
		this.app.services.map((service) => 
			`const ${service.camelCaseName}Router = require('./services/${service.camelCaseName}/router')`
		).join(`\n`) + `\n` +
		`\n\n` +
		`const router = (fastify, options, done) => {\n` +
		this.app.services.map((service) => 
			`	fastify.register(${service.camelCaseName}Router, { prefix: '${service.camelCaseName}' })`
			).join(`\n`) + `\n` +
		`\n` +
		`	done()\n` +
		`}\n` +
		`\n\n` +
		`module.exports = router`
	)
	routerFile.close()
	//#endregion
	// #region Create and Fill testsFile
	const testsFile = fs.createWriteStream(`${this.srcPath}/app.test.js`)
	testsFile.write(
		`const test = require('tap').test\n` +
		`\n` +
		this.app.services.map((service) => 
			`const ${service.camelCaseName}Tests = require('./services/${service.camelCaseName}/tests.test')`
		).join(`\n`) + `\n` +
		`\n\n` +
		`const tests = {\n` +
		this.app.services.map((service) => 
			`	${service.camelCaseName}: true`
		).join(`,\n`) + `\n` +
		`}\n` +
		`\n\n` +
		this.app.services.map((service) => 
			`test('${service.camelCaseName}', { only: tests.${service.camelCaseName} }, async (t) =>\n` +
			`	${service.camelCaseName}Tests(t)\n` +
			`)`
		).join(`\n`)
	)
	testsFile.close()
	//#endregion
}
// #region Utils
const mkDir = (dirName) => {
	if (!fs.existsSync(dirName)) {
		fs.mkdirSync(dirName, { recursive: true })
 	}
}

const pgRow_to_jsObject = (pgRow, jsKeys) => {
	const entries = Object.keys(pgRow).map(
		key => ({[jsKeys[key]]: pgRow[key]})
	)
	return Object.assign({}, ...entries)
}

const camelCaseName = (name) => {
	const matches = name.matchAll(/(^|_|)(.+?)(_|$)/gm)
	let result = ''
	for (const match of matches){
		result += match[1]
		if (match.index == 0) {
			result += match[2].toLowerCase()
			continue
		}
		result += match[2][0].toUpperCase() + match[2].slice(1).toLowerCase()
	}
	return result
}

const PascalCaseName = (name) => {
	const matches = name.matchAll(/(^|_|)(.+?)(_|$)/gm)
	let result = ''
	for (const match of matches){
		result += match[1]
		result += match[2][0].toUpperCase() + match[2].slice(1).toLowerCase()
	}
	return result
}

const getColumnDataType = (column) => {
	const type = column.type
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

const objectToPrettyText = (obj, indent=0) => {
	const nextIndent = indent + 1

	if (obj == null)
		return 'null'

	if (obj == undefined)
		return 'undefined'

	if (typeof obj == 'string')
			return `'${obj}'`

	if (typeof obj == 'number') {
		const numbers = obj.toString().split('').reverse()
		let temp = []
		for (let i = 0; i < numbers.length; i++) {
			if (i != 0 && i % 3 == 0)
				temp.push('_')
			temp.push(numbers[i])
		}
		return temp.reverse().join('')
	}

	if (Array.isArray(obj)) {
		if (obj.length == 0)
			return '[]'

		return (
			`[\n` +
			obj.map(
				item => `${'\t'.repeat(nextIndent)}${objectToPrettyText(item, nextIndent)}`
			).join(',\n') + '\n' +
			`${'\t'.repeat(indent)}]`
		)
	}
		
	if (typeof obj != 'object')
		return obj.toString()

	const keys = Object.keys(obj)
	if (keys.length == 0)
		return '{}'

	return (
		`{\n` +
		keys.map((key) => 
			`${'\t'.repeat(nextIndent)}${key}: ${objectToPrettyText(obj[key], nextIndent)}`
		).join(',\n') + '\n' +
		('\t'.repeat(indent)) + `}`
	)
}
//#endregion
module.exports = generateSrc