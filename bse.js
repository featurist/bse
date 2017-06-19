const cli = require('banana-shark').cli
const hyperdom = require('hyperdom')

const h = hyperdom.html
class HyperdomApp {
  constructor(suite) {
    this.suite = suite
    this.hidePassed = true
  }

  render() {
    return h(
      '.bse',
      h('pre', process.argv.join(' ')),
      h(
        '.results',
        `${this.suite.passed} passed, ${this.suite.failed} failed`,
        h('form',
          h('label',
            h('input', { type: 'checkbox', binding: [this, 'hidePassed'] }),
            'hide passing results'
          )
        ),
        this.suite.specs.map(spec =>
          h('div.descriptions', spec.descriptions.map(description =>
            h('div.assertions', description.assertions.map(assertion =>
              this.renderAssertion(assertion)
            )
          )))
        )
      )
    )
  }

  renderAssertion(assertion) {
    if (assertion.passed && !this.hidePassed)
      return h('pre', { style: { color: 'green' } }, assertion.trail().join("\n"))
    else if (assertion.failed)
      return h('pre', { style: { color: 'red' } }, assertion.trail().join("\n"), "\n", assertion.error.stack)
    else if (assertion.assertions)
      return assertion.assertions.map(nested => this.renderAssertion(nested))
  }
}

class ElectronListener {
  suiteStarted(suite) {
    this.passed = 0
    this.failed = 0
  }

  suiteEnded(suite) {
    const style = document.createElement('style')
    style.innerHTML = '.bse { font-family: sans-serif } .bse .results form { padding: 5px 0;  }'
    document.body.appendChild(style)

    const div = document.createElement('div')
    document.body.appendChild(div)
    suite.passed = this.passed
    suite.failed = this.failed
    hyperdom.append(div, new HyperdomApp(suite))
  }

  specStarted() {}
  specEnded() {}

  descriptionStarted() {}
  descriptionEnded() {}

  assertionStarted() {}
  assertionPassed(assertion) {
    assertion.passed = true
    this.passed++
  }
  assertionFailed(assertion, error) {
    assertion.failed = true
    assertion.error = error
    this.failed++
  }

  unexpectedError(e) {
    console.log(e)
  }
}

cli.runWithListener(process.argv.slice(2), new ElectronListener())
