const { test } = require('tap')
const { buildApp } = require('../app')

const testTests = require('./generated/test')
const linkTypeTests = require('./generated/linkType')
const hiperLinkTests = require('./generated/hiperLink')


const tests = {
	test: true,
	linkType: true,
	hiperLink: true,
}


const testTests = (parentTest) => {
	test(
		'test.test', { only: tests.test },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			testTests(parentTest, t, app)
		}
	)
	test(
		'test.linkType', { only: tests.linkType },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			linkTypeTests(parentTest, t, app)
		}
	)
	test(
		'test.hiperLink', { only: tests.hiperLink },
		async (t) => {
			const app = await buildApp()
			t.teardown(_ => app.close())

			hiperLinkTests(parentTest, t, app)
		}
	)
}


module.exports = testTests