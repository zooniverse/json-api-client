print = (level, color, messages...) ->
  # Set the log level with a global variable or a query param in the page's URL.
  setting = JSON_API_LOG_LEVEL ? parseFloat location?.search.match(/json-api-log=(\d+)/)?[1] ? 0

  if setting >= level
    # We can style text in the browser console, but not as easily in Node.
    prefix = if location?
      ['%c{json:api}', "color: #{color}; font: bold 1em monospace;"]
    else
      ['{json:api}']

    console?.log prefix..., messages...

module.exports =
  log: print.bind null, 4, 'gray'
  info: print.bind null, 3, 'blue'
  warn: print.bind null, 2, 'orange'
  error: print.bind null, 1, 'red'
