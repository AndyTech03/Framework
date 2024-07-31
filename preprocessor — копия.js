const fs = require('fs')
const { functionsTemplate, exportsTemplate } = require('./blueprints/jsTemplates/files')
const { log } = require('console')
const { deleteForeignKeys, foreignKey } = require('./blueprints/queries/foreignKeys')
const { routerTemplate } = require('./blueprints/routers/routers')
const { mainTestsTemplate, componentTestsTemplate } = require('./blueprints/tests/tests')
const { tablesTemplate } = require('./blueprints/queries/tables')
const queriesRouter = require('./blueprints/queries/queriesRouter')
const routesRouter = require('./blueprints/routes/routesRouter')


const generateSrc = (fileName) => {
	const model = JSON.parse(fs.readFileSync(fileName).toString())
	{	// Default values
		model.components = model.app.components || []
	}
	{	// Insomtia values
		this.insomniaData = { 
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
		this.req_id = 1
		this.fld_id = 1
		this.pair_id = 1
	}
	{	// foreignKeys
		
		this.foreignKeys = []
		this.arrayForeignKeys = []
	}
	{	// Create root dirs
		if (fs.existsSync('./src'))
			fs.rmSync('./src', { recursive: true })
		mkDir('./src/doc')
		mkDir('./src/components')
		mkDir('./src/utils')
	}
	{	// Order components by name desc
		this.components = model.components.sort((a, b) => 
			a.name == b.name ? 1 : (
				a.name < b.name ? 1 : -1
			)
		)
	}
	for (const component of this.components) {
		{ 	// Calculate Names
			component.pgSchemaName = component.pgSchemaName || component.name.toLowerCase()
			component.camelCaseName = component.camelCaseName || camelCaseName(component.name)
			component.folderName = `./src/components/${component.camelCaseName}`
			component.libsFolderName = `${component.folderName}/libs`
			component.queriesFolderName = `${component.folderName}/queries`
			component.routersFolderName = `${component.folderName}/routers`
			component.testsFolderName = `${component.folderName}/tests`
		}
		{	// Default values
			component.tables = component.tables || []
			component.queries = component.queries || []
			component.routes = component.routes || []
			component.tests = []
			component.routers = []
		}
		{	// Create component dirs
			mkDir(component.folderName)
			mkDir(component.queriesFolderName)
			mkDir(component.routersFolderName)
			mkDir(component.testsFolderName)
			mkDir(component.libsFolderName)
		}
		{	// Order tables by name desc
			component.tables = component.tables.sort((a, b) => 
				a.name == b.name ? 1 : (
					a.name < b.name ? 1 : -1
				)
			)
		}
		for (const table of component.tables) {
			{ 	// Calculate Names
				table.pgName = table.pgName || table.name
				table.pgSchemaName = component.pgSchemaName
				table.lowerCaseName = table.pgName.toLowerCase()
				table.camelCaseName = table.camelCaseName || camelCaseName(table.name)
				table.PascalCaseName = table.PascalCaseName || PascalCaseName(table.camelCaseName)
			}
			{	// Default values
				table.primaryKeys = table.primaryKeys || []
				table.foreignKeys = table.foreignKeys || []
				table.uniqueKeys = table.uniqueKeys || []
				table.columns = table.columns || []
				table.libs = table.libs || []
				table.queries = table.queries || []
				table.routes = table.routes || []
				table.tests = table.tests || []
			}
			table.columns = table.columns.map(
				column => ({ 
					...column, 
					camelCaseName: camelCaseName(column.name),
					dataType: getColumnDataType(column)
				})
			)
			log(table.columns)
			{	// Filters
				table.primaryKeysColumns = table.columns.filter(
					column => table.primaryKeys.includes(column.name)
				)
				table.nonEditableColumns = table.columns.filter(
					column => (
						column.nonEditable == true || 				// помечена как не редактируемая
						column.defaultOnUpdate == true || 			// или помечена как default on update
						column.type.includes('serial') ||			// или serial
						table.primaryKeysColumns.includes(column)	// или primary	
					)
				)
				table.editableColumns = table.columns.filter(
					column => table.nonEditableColumns.includes(column) == false
				)
				table.editableOrPrimary = table.columns.filter(
					column => (
						table.primaryKeysColumns.includes(column) ||
						table.editableColumns.includes(column)
					)
				)
				table.defaultOnUpdate = table.nonEditableColumns.filter(
					column => column.defaultOnUpdate == true
				)
				table.editableOrDefault = table.columns.filter(
					column => (
						table.defaultOnUpdate.includes(column) ||
						table.editableColumns.includes(column)
					)
				)
				table.insertArgs = table.columns.filter(
					column => (
							column.default == undefined ||				// NOT has some default value
							table.primaryKeysColumns.includes(column)	// or is primary key 
					) && column.type.includes('serial') == false		// and NOT serial type
				)
				table.primaryNotArgs = table.primaryKeysColumns.filter(
					column => table.insertArgs.includes(column) == false
				)
				table.primarySerial = table.primaryKeysColumns.filter(
					column => column.type.includes('serial')
				)
				table.primaryOrArgs = table.columns.filter(
					column => 
						table.primaryKeysColumns.includes(column) ||
						table.insertArgs.includes(column)
				)
				table.notPrimary = table.columns.filter(
					column => table.primaryKeysColumns.includes(column) == false
				)
			}
			{	// Open table files
				table.libsFile = fs.createWriteStream(`${component.libsFolderName}/${table.camelCaseName}.js`, {autoClose: true})
				table.queriesFile = fs.createWriteStream(`${component.queriesFolderName}/${table.camelCaseName}.pg.sql`, {autoClose: true})
				table.routesFile = fs.createWriteStream(`${component.routersFolderName}/${table.camelCaseName}.js`, {autoClose: true})
				table.testsFile = fs.createWriteStream(`${component.testsFolderName}/${table.camelCaseName}.test.js`, {autoClose: true})
			}
			{	// Order routes by priority asc
				table.routes = table.routes.sort((a, b) => {
					const priorityA = routesRouter[a.name].priority
					const priorityB = routesRouter[b.name].priority
					return priorityA == priorityB ? 1 : (
						priorityA > priorityB ? 1 : -1
					)
				})
			}
			{	// Write routesFile
				log(table.routes)
				const routes = table.routes.map(
					route => routesRouter[route.name]
				)
				table.routesFile.write(
					routes.map(
						route => route.routeTemplate(table, route)
					).join('\n\n') + '\n\n' +
					routes.map(
						route => route.controllerTemplate(table, route)
					).join('\n\n') + '\n\n'
				)
			}
			{	// Order queries by priority asc
				table.queries = table.queries.sort((a, b) => {
					const priorityA = queriesRouter[a.name].priority
					const priorityB = queriesRouter[b.name].priority
					return priorityA == priorityB ? 1 : (
						priorityA > priorityB ? 1 : -1
					)
				})
			}
			{	// Write queriesFile
				log(table.queries)
				const queries = table.queries.map(
					query => queriesRouter[query.name].template(
						component.pgSchemaName, table, query
					)
				)
				table.queriesFile.write(
					queries.join('\n\n')
				)
			}
		}
		{	// Open component files
			component.tablesFile = fs.createWriteStream(`${component.folderName}/componentTables.pg.sql`, {autoClose: true})
			component.mainRouterFile = fs.createWriteStream(`${component.folderName}/componentRouter.js`, {autoClose: true})
			component.mainTestsFile = fs.createWriteStream(`${component.folderName}/componentTests.test.js`, {autoClose: true})
		}
		{	// Write tablesFile
			component.tablesFile.write(
				tablesTemplate(component.pgSchemaName, component.tables)
			)
		}
		{	// Write mainRouterFile
			component.mainRouterFile.write(
				routerTemplate(component.camelCaseName, component.routers)
			)
		}
		{	// Write mainTestsFile
			component.mainTestsFile.write(
				componentTestsTemplate(component.tests)
			)
		}
	}
	{	// Open global files
		this.insomniaFile = fs.createWriteStream(`./src/doc/!Insomnia.json`, {autoClose: true})
		this.foreignKeysFile = fs.createWriteStream(`./src/components/foreignKeys.pg.sql`, {autoClose: true})
		this.mainRouterFile = fs.createWriteStream(`./src/components/mainRouter.js`, {autoClose: true})
		this.mainTestsFile = fs.createWriteStream(`./src/components/mainTests.test.js`, {autoClose: true})
		this.utilsFile = fs.createWriteStream(`./src/utils/mainUtils.js`, {autoClose: true})
	}
	{	// Write insomniaFile
		this.insomniaFile.write(JSON.stringify(this.insomniaData))
	}
	{	// Write foreignKeysFile
		this.foreignKeysFile.write(deleteForeignKeys())
		this.foreignKeysFile.write('\n\n\n')
		this.foreignKeysFile.write(
			this.foreignKeys.map(
				foreignKey
			).join('/n/n')
		)
	}
	{	// Write mainRouterFile
		const routers = this.components.reduce((result, component) =>
			[
				...result, 
				{
					camelCaseName: component.camelCaseName,
					path: `${component.camelCaseName}/componentRouter`
				}
			], []
		)
		this.mainRouterFile.write(routerTemplate('main', routers))
	}
	{	// Write mainTestsFile
		this.mainTestsFile.write(
			mainTestsTemplate(this.components)
		)
	}
	{	// Write utilsFile
		const utilsFuncs = [pgRow_to_jsObject]
		this.utilsFile.write(
			functionsTemplate(utilsFuncs) + `\n` +
			exportsTemplate(utilsFuncs)
		)
	}
}

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

const PascalCaseName = (camelCaseName) => {
	return camelCaseName[0].toUpperCase() + camelCaseName.slice(1)
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

module.exports = generateSrc