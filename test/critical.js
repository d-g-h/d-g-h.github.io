'use strict';

describe('Critical CSS', function () {
  before(function (done) {
    var critical = require('../../lib/gulp/dist/critical');
    critical({
      inline: true,
      base: '/Users/dggh/d-g-h.github.com/test/fixtures/',
      src: '/Users/dggh/d-g-h.github.com/test/fixtures/index.html',
      dest: '/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html',
      width: 1440,
      height: 400,
      minify: true
    }, function (err) {
      if (err) throw err;
      done();
    });
  });

  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      console.log(process.env.PWD);
    });
  });
});

