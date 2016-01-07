'use strict';

var _critical = require('critical');

var _critical2 = _interopRequireDefault(_critical);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (obj, callback) {
  _critical2.default.generate(obj, function (err, res) {
    if (err) return callback(err);
    return callback(null, res);
  });
};