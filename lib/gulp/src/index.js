'use strict';
import critical from 'critical';

module.exports = (obj, callback) => {
  critical.generate(obj, (err, res) => {
    if (err) return callback(err);
    return callback(null, res);
  });
};
