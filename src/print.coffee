LOG_LEVEL = parseFloat location.search.match(/json-api-log=(\d+)/)?[1] ? 0

print = (level, color, messages...) ->
  if LOG_LEVEL >= level
    console.log '%c{json:api}', "color: #{color}; font: bold 1em monospace;", messages...

module.exports =
  log: print.bind null, 4, 'gray'
  info: print.bind null, 3, 'blue'
  warn: print.bind null, 2, 'orange'
  error: print.bind null, 1, 'red'
