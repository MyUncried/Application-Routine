const {Existing} = require('../../shared/ui/Existing');

// Documentary selection state (docs/spec.md STATE-1): initially off.
// This is a Boolean observable for the disposable protocol test, not a
// rendered chip selection.
let selection = false;

function toggle() {
  selection = !selection;
  return selection;
}

module.exports = {Existing, toggle};
