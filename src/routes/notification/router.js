const notificationTypeRoutes = require('./generated/notificationType')
const notificationRoutes = require('./generated/notification')
const accountNotificationRoutes = require('./generated/accountNotification')
const accountNotificationSettingsRoutes = require('./generated/accountNotificationSettings')


const notificationRouter = (fastify, _, done) => {
	notificationTypeRoutes(fastify)
	notificationRoutes(fastify)
	accountNotificationRoutes(fastify)
	accountNotificationSettingsRoutes(fastify)

	done()
}


module.exports = notificationRouter