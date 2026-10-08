// Existing ordering assertions ignore added safety options, not executable steps.
// Dedicated D11 behavior tests exercise the raw safe Git invocation.
module.exports = source => source
  .replace(/\bgit\s+-c core.hooksPath=NUL -c core.fsmonitor=false\s+/g, 'git ')
  .replace(/\bgit\s+-c "http\.https:\/\/github\.com\/\.extraheader=AUTHORIZATION: basic \$auth"\s+/g, 'git ');
