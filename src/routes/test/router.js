const testRoutes = require('./generated/test')
const linkTypeRoutes = require('./generated/linkType')
const hiperLinkRoutes = require('./generated/hiperLink')


const testRoutes = (fastify, _, done) => {
	testRoutes(fastify)
	linkTypeRoutes(fastify)
	hiperLinkRoutes(fastify)

	done()
}


module.exports = testRoutes