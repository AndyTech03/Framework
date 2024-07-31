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
		this.app = model.app || {}
		this.app = {
			name: this.app.name || 'Generated App Name',
			defaultOptions: this.app.defaultOptions || null,
			environments: this.app.environments || [],
			imports: this.app.imports || [],
			plugins: this.app.plugins || [],
			services: this.app.services || [],
		}
	}
	{	// Create root dirs
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
	}
	{	// Create and Fill environments files
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
	}
	{	// Importing plugins
		for (const plugin of this.app.plugins) {
			fs.copyFileSync(
				`./plugins/${plugin.name}.js`,
				`${this.pluginsPath}/${plugin.name}.js`
			)
		}
	}
	{	// Create and Fill appFile
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
	}
	{	// Create and Fill serverFile
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
	}
	{	// Create root files
		this.routerFile = fs.createWriteStream(`${this.srcPath}/router.js`, {autoClose: true})
		this.testsFile = fs.createWriteStream(`${this.srcPath}/app.test.js`, {autoClose: true})
	}
	{	// Fill routerFile
		this.routerFile.write(
			`const router = (fastify, options, done) => {\n` +
			`	done()\n` +
			`}\n` +
			`\n\n` +
			`module.exports = router`
		)
	}
	{	// Fill routerFile
		this.testsFile.write(
			`const test = require('tap').test\n` +
			`\n\n` +
			`const tests = {\n` +
			`	test: true\n` +
			`}\n` +
			`\n\n` +
			`test('test', { only: tests.test }, (t) => {})`
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

module.exports = generateSrc