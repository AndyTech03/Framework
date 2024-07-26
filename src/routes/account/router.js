const accountStateRoutes = require('./generated/accountState')
const accountRoleRoutes = require('./generated/accountRole')
const accountRoutes = require('./generated/account')


const accountRouter = (fastify, _, done) => {
	accountStateRoutes(fastify)
	accountRoleRoutes(fastify)
	accountRoutes(fastify)

	done()
}


module.exports = accountRouter