const { test } = require('tap')
const { buildApp } = require('../app')

const accountTests = require('./generated/account')


const tests = {
	account: true,
}


const accountTests = (parentTest) => {
	test(
		'account.account', { only: tests.account },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			accountTests(parentTest, t, app)
		}
	)
}


module.exports = accountTests