'use strict';

import expect from 'expect.js';
import fs from 'fs';

const critical = require('../../lib/gulp/dist/critical');

describe('Critical CSS', function() {
  this.timeout(0);

  before(function(done) {
    critical({
      inline: true,
      base: '/Users/dggh/d-g-h.github.com/test/fixtures/',
      src: '/Users/dggh/d-g-h.github.com/test/fixtures/index.html',
      dest: '/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html',
      width: 1440,
      height: 400,
      minify: true
    }, function() {
      done();
    });
  });

  it('File created', function(done) {
    fs.stat('/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html', function(err, stats) {
      if (err) throw err;
      expect(stats.isFile()).eql(true);
      done();
    });
  });

  after(function(done) {
    fs.unlink('/Users/dggh/d-g-h.github.com/test/fixtures/index-critical.html', function(err) {
      if (err) throw err;
      done();
    });
  });
});
