const { log } = require('console')
const fs = require('fs')

const { 
	mkDir,
	pgRow_to_jsObject,
	camelCaseName,
	PascalCaseName,
	getColumnDataType,
	objectToPrettyText,
} = require('./utils')
const {
	generateHandler,
	operateHandlerRefs
} = require('./blueprints/handlers')
const selectSender = require('./blueprints/senders')
const selectCatcher = require('./blueprints/catchers')
const selectFinisher = require('./blueprints/finishers')


const generateSrc = (fileName) => {
	const model = JSON.parse(fs.readFileSync(fileName).toString())
	//#region Default values
	this.rootPath = './result'
	this.srcPath = `${this.rootPath}/src`
	this.docPath = `${this.srcPath}/doc`
	this.pluginsPath = `${this.srcPath}/plugins`
	this.servicesPath = `${this.srcPath}/services`
	this.app = {
		name: model.app.name || 'Generated App Name',
		defaultOptions: undefined,
		environments: [],
		imports: [],
		plugins: [],
		services: [],
		...model.app
	}
	// #endregion
	//#region Compile Services
	this.app.services = this.app.services.map((service) => {
		const serviceId = service.id
		const pgSchemaId = service.pgSchema.id
		let templates = service.templates || []
		let tables = service.tables || []
		let adapters = service.adapters || []
		//#region Copmile Templates
		templates = templates.map((template) => {
			return {
				service: null,
				...template,
			}
		})
		//#endregion
		//#region Copmile Tables
		tables = tables.map((table) => {
			const tableId = table.id
			const primaryKeysIds = table.primaryKeysIds || []
			const foreignKeys = table.foreignKeys || []
			const foreignArrayKeys = table.foreignArrayKeys || []
			const uniqueKeys = table.uniqueKeys || []
			let columns = table.columns || []
			let primaryKeysColumns;
			//#region Compile Columns
			columns = columns.map((column) => {
				const columnId = column.id

				return {
					table: null,
					id: columnId,
					camelCaseName: camelCaseName(columnId),
					PascalCaseName: PascalCaseName(columnId),
					dataType: getColumnDataType(column),
					default: undefined,
					onUpdate: undefined,
					nonEditable: undefined,
					...column,
					flags: {
						primaryKey: primaryKeysIds.includes(columnId),
						foreignKey: foreignKeys.some((key) => 
							key.columnsIds.includes(columnId)
						),
						foreignArrayKey: foreignArrayKeys.some((key) => 
							key.arrayColumnId = columnId
						),
						uniqueKey: uniqueKeys.some((key) => 
							key.includes.columnId
						),
						editable: column.nonEditable != true,
						array: column.type.match(/( array|\[\])$/) != null,
						serial: column.type.endsWith('serial'),
						hasDefault: column.default != undefined,
					}
				}
			})
			//#endregion
			//#region Filter primaryKeysColumns
			primaryKeysColumns = columns.filter((column) => 
				column.flags.primaryKey
			)
			//#endregion
			return {
				service: null,
				camelCaseName: camelCaseName(tableId),
				PascalCaseName: PascalCaseName(tableId),
				...table,
				primaryKeysIds: primaryKeysIds,
				foreignKeys: foreignKeys,
				foreignArrayKeys: foreignArrayKeys,
				uniqueKeys: uniqueKeys,
				columns: columns,
			}
		})
		//#endregion
		//#region Copmile Adapters
		adapters = adapters.map((adapter) => {
			const adapterId = adapter.id
			let routes = adapter.routes || []
			//#region Compile Routes
			routes = routes.map((route) => {
				const routeId = route.id
				let handlers = route.handlers || []
				let catchers = route.catchers || []
				//#region Compile Handlers
				handlers = handlers.map((handler) => {
					const handlerId = handler.id

					return {
						route: null,
						rootPath: null,
						camelCaseName: camelCaseName(handlerId),
						PascalCaseName: PascalCaseName(handlerId),
						...handler,
						maper: {
							handler: null,
							...handler.maper
						},
						worker: {
							handler: null,
							...handler.worker
						},
						validator: {
							handler: null,
							...handler.validator
						}
					}
				})
				//#endregion
				//#region Compile Catchers
				catchers = catchers.map((catcher) => {
					const catcherId = catcher.id

					return {
						route: null,
						camelCaseName: camelCaseName(catcherId),
						PascalCaseName: PascalCaseName(catcherId),
						...catcher,
					}
				})
				//#endregion 

				return {
					adapter: null,
					camelCaseName: camelCaseName(routeId),
					PascalCaseName: PascalCaseName(routeId),
					...route,
					handlers: handlers,
					sender: {
						route: null,
						...route.sender
					},
					catchers: catchers,
					finisher: {
						route: null,
						...route.sender
					},
				}
			})
			//#endregion
			
			return {
				service: null,
				camelCaseName: camelCaseName(adapterId),
				PascalCaseName: PascalCaseName(adapterId),
				...adapter,
				routes,
			}
		})
		//#endregion

		return {
			app: null,
			rootPath: null,
			camelCaseName: camelCaseName(serviceId),
			PascalCaseName: PascalCaseName(serviceId),
			...service,
			pgSchema: {
				id: pgSchemaId,
				camelCaseName: camelCaseName(pgSchemaId),
				PascalCaseName: PascalCaseName(pgSchemaId),
				...service.pgSchema,
			},
			templates: templates,
			tables: tables,
			adapters: adapters,
		}
	})
	this.app.services.map((service) => {
		service.app = this.app
		service.rootPath = service.rootPath || `${this.servicesPath}/${service.camelCaseName}`
		service.templates.map((template) => {
			template.service = service
		})
		service.tables.map((table) => {
			table.service = service
			table.columns.map((column) => {
				column.table = table
			})
		})
		service.adapters.map((adapter) => {
			adapter.service = service
			adapter.rootPath = adapter.rootPath || `${service.rootPath}/${adapter.camelCaseName}`
			adapter.routes.map((route) => {
				route.adapter = adapter
				route.sender.route = route
				route.finisher.route = route
				route.handlers.map((handler) => {
					handler.route = route
					handler.maper.handler = handler
					handler.worker.handler = handler
					handler.validator.handler = handler
				})
				route.catchers.map((catcher) => {
					catcher.route = route
				})
					
			})
		})
	})
	//#endregion
	// log(objectToPrettyText(this.app))
	// #region Create root dirs
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
		`${this.srcPath}/utils`,
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
		`\n` +
		`	// Router\n` +
		`	app.register(router)\n` +
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
		// #region Create service dirs
		mkDir(service.rootPath)
		//#endregion
		for (let adapter of service.adapters) {
			// #region Create adapter dir
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
				`const { errorsHandler } = require("../../../utils/js/errorHandler")\n` +
				`\n\n` +
				`const adapter = (fastify, options, done) => {\n` +
				`	const client = fastify.postgresql.client\n` +
				adapter.routes.map((route) =>
					`	fastify.${route.requestJsonSchema.method}('${route.requestJsonSchema.path}', async (request, reply) => {\n` +
					`		this.results = []\n` +
					`		Promise.resolve(\n` +
					route.handlers.map((handler) => {
						operateHandlerRefs(handler)
						return generateHandler(handler, 2)
					}).join('\n') + '\n' +
					`		).then(() => {\n` +
					selectSender(route.sender, 2) +
					`		}` +
					route.catchers.map((catcher) =>
								`).catch((error) => {\n` +
						selectCatcher(catcher, 2) +
						`		}`
					).join('') +
							`).finally(() => {\n` +
					selectFinisher(route.finisher, 2) +
					`		})\n` +
					`		return reply\n` +
					`	})`
				).join(`\n\n`) + `\n` +
				`\n` +
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
			`drop schema if exists ${service.pgSchema.id} cascade;\n` +
			`create schema ${service.pgSchema.id};\n` +
			`\n\n` +
			service.tables.map((table) =>
				`create table ${service.pgSchema.id}.${table.id} (` +
				[
					table.columns.map((column) => 
					`\n	${column.id} ${column.type} not null` + (
						column.flags.hasDefault ? (
							`\n		default ${column.default}`
						) : '')
					).join(','),
					[
						`	primary key (` +
						table.primaryKeysIds.join(', ') + `)`,
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
				`--	--	Service ${service.id}\n` +
				service.tables.map((table) =>
					`--	Table ${service.pgSchema.id}.${table.id}\n` +
					table.foreignKeys.map((key) =>
						`alter table ${service.pgSchema.id}.${table.id}\n`+
						`add constraint fkey_${service.pgSchema.id}_${table.id}__${
							key.columnsIds.join('__')
						}\n` +
						`foreign key (\n` +
						`	${key.columnsIds.join(', ')}\n` +
						`) references ${key.reference.pgSchemaId}.${key.reference.tableId} (\n` +
						`	${key.reference.columnsIds.join(', ')}\n` +
						`);`
					).concat(
						table.foreignArrayKeys.map((arrayKey) =>
							`alter table ${service.pgSchema.id}.${table.id}\n`+
							`add constraint array_fkey_${service.pgSchema.id}_${table.id}__` +
							`${arrayKey.arrayColumnId} check (\n` +
							`	test.array_fkey_chech(${arrayKey.arrayColumnId}::text, ` +
							`'${arrayKey.reference.pgSchemaId}.${arrayKey.reference.tableId}', '${arrayKey.reference.columnId}')\n` +
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


module.exports = generateSrc