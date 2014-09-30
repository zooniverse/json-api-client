# Make a raw, non-API specific HTTP request.

module.exports = (method, url, data, headers, modify) ->
  new Promise (resolve, reject) ->
    request = new XMLHttpRequest
    request.open method, encodeURI url

    if headers?
      for header, value of headers
        request.setRequestHeader header, value

    if modify?
      modify request

    request.onreadystatechange = (e) ->
      console.log 'Ready state:', (key for key, value of request when value is request.readyState and key isnt 'readyState')[0]
      if request.readyState is request.DONE
        console.log 'Done; status is', request.status
        if 200 <= request.status < 300
          resolve request
        else if 400 <= request.status < 600
          reject new Error request.responseText

    request.send JSON.stringify data
