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

const columns_toJson = (columns) => JSON.stringify(
    columns.reduce((result, column, i) => 
        ({...result, [column.jsName]: getColumnMockValue(column)}), {}
    ), 
    null, '\t'
)

const pgRow_to_jsObject = (pgRow, jsKeys) => {
    const entries = Object.keys(pgRow).map(
        key => ({[jsKeys[key]]: pgRow[key]})
    )
    return Object.assign({}, ...entries)
}

module.exports = {
    getSerialType_orDefault,
    getColumnMockValue,
    getDateTimeString,
    getColumnMockValue,
    columns_toJson,
    pgRow_to_jsObject
}