const fs = require('fs')


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

module.exports = {
   mkDir,
   pgRow_to_jsObject,
   camelCaseName,
   PascalCaseName,
   getColumnDataType,
   objectToPrettyText,
}