module.exports = (method, url, data, headers, modify) ->
  new Promise (resolve, reject) ->
    method = method.toUpperCase()

    if data? and method is 'GET'
      url += '?' + ([key, value].join '=' for key, value of data).join '&'
      data = null

    request = new XMLHttpRequest
    request.open method, encodeURI url

    request.withCredentials = true

    if headers?
      for header, value of headers
        request.setRequestHeader header, value

    if modify?
      modify request

    request.onreadystatechange = (e) ->
      if request.readyState is request.DONE
        if 200 <= request.status < 300
          resolve request
        else
          reject request

    if data? and headers?['Content-Type']?.indexOf('json') isnt -1
      data = JSON.stringify data

    request.send data
