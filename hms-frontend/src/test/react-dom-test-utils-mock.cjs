const React = require('react');

module.exports = {
  act: React.act || ((cb) => {
    const result = cb();
    if (result && typeof result.then === 'function') {
      return result;
    }
    return Promise.resolve();
  }),
  renderIntoDocument: () => {},
  Simulate: {},
};
