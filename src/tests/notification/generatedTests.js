const { test } = require('tap')
const { buildApp } = require('../app')

const notificationTypeTests = require('./generated/notificationType')
const notificationTests = require('./generated/notification')
const accountNotificationTests = require('./generated/accountNotification')
const accountNotificationSettingsTests = require('./generated/accountNotificationSettings')


const tests = {
	notificationType: true,
	notification: true,
	accountNotification: true,
	accountNotificationSettings: true,
}


const notificationTests = (parentTest) => {
	test(
		'notification.notificationType', { only: tests.notificationType },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			notificationTypeTests(parentTest, t, app)
		}
	)
	test(
		'notification.notification', { only: tests.notification },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			notificationTests(parentTest, t, app)
		}
	)
	test(
		'notification.accountNotification', { only: tests.accountNotification },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			accountNotificationTests(parentTest, t, app)
		}
	)
	test(
		'notification.accountNotificationSettings', { only: tests.accountNotificationSettings },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			accountNotificationSettingsTests(parentTest, t, app)
		}
	)
}


module.exports = notificationTests