print = (color, messages...) ->
  console.log '%c{json:api}', "color: #{color}; font: bold 1em monospace;", messages...

module.exports =
  log: print.bind null, 'gray'
  info: print.bind null, 'blue'
  warn: print.bind null, 'orange'
  error: print.bind null, 'red'
