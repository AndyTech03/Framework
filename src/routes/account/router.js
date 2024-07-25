const accountRoutes = require('./generated/account')


const accountRouter = (fastify, _, done) => {
	accountRoutes(fastify)

	done()
}


module.exports = accountRouter