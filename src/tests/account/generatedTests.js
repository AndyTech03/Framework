const { test } = require('tap')
const { buildApp } = require('../app')

const accountStateTests = require('./generated/accountState')
const accountRoleTests = require('./generated/accountRole')
const accountTests = require('./generated/account')


const tests = {
	accountState: true,
	accountRole: true,
	account: true,
}


const accountTests = (parentTest) => {
	test(
		'account.accountState', { only: tests.accountState },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			accountStateTests(parentTest, t, app)
		}
	)
	test(
		'account.accountRole', { only: tests.accountRole },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			accountRoleTests(parentTest, t, app)
		}
	)
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