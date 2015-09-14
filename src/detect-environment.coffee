module.exports = if process?.browser or (window? and not process?)
  'browser'
else
  'node'
