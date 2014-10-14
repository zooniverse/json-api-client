print = require './print'

# Make a raw, non-API specific HTTP request.

module.exports = (method, url, data, headers, modify) ->
  print.info 'Requesting', method, url, data
  new Promise (resolve, reject) ->
    request = new XMLHttpRequest
    request.open method, encodeURI url

    request.withCredentials = true

    if headers?
      for header, value of headers
        request.setRequestHeader header, value

    if modify?
      modifications = modify request

    request.onreadystatechange = (e) ->
      print.log 'Ready state:', (key for key, value of request when value is request.readyState and key isnt 'readyState')[0]
      if request.readyState is request.DONE
        print.log 'Done; status is', request.status
        if 200 <= request.status < 300
          resolve request
        else # if 400 <= request.status < 600
          reject request

    request.send JSON.stringify data
