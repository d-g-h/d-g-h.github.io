'use strict';

var _expect = require('expect.js');

var _expect2 = _interopRequireDefault(_expect);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var critical = require('../../lib/gulp/dist/critical');

describe('Critical CSS', function () {
  this.timeout(0);

  before(function (done) {
    critical({
      inline: true,
      base: '/Users/dggh/d-g-h.github.com/test/fixtures/',
      src: '/Users/dggh/d-g-h.github.com/test/fixtures/index.html',
      dest: '/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html',
      width: 1440,
      height: 400,
      minify: true
    }, function () {
      done();
    });
  });

  it('File created', function (done) {
    _fs2.default.stat('/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html', function (err, stats) {
      if (err) throw err;
      (0, _expect2.default)(stats.isFile()).eql(true);
      done();
    });
  });

  after(function (done) {
    _fs2.default.unlink('/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html', function (err) {
      if (err) throw err;
      done();
    });
  });
});