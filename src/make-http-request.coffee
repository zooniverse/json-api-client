# This should be just long enough that near-simultaneous GETs don't make multiple requests.
CACHE_FOR = 1000

cachedGets = {}

module.exports = (method, url, data, headers, modify) ->
  method = method.toUpperCase()

  if method is 'GET'
    if data? and Object.keys(data).length isnt 0
      url += if url.indexOf('?') is -1
        '?'
      else
        '&'
      url += ([key, value].join '=' for key, value of data).join '&'
      data = null

    promise = cachedGets[url]

  promise ?= new Promise (resolve, reject) ->
    # console.log "Opening #{method} request for #{url}", data

    request = new XMLHttpRequest
    request.open method, encodeURI url

    request.withCredentials = true

    if headers?
      for header, value of headers when value?
        request.setRequestHeader header, value

    if modify?
      modify request

    request.onreadystatechange = (e) ->
      if request.readyState is request.DONE
        if 200 <= request.status < 300
          if method is 'GET'
            setTimeout (-> delete cachedGets[url]), CACHE_FOR
          resolve request
        else
          if method is 'GET'
            setTimeout (-> delete cachedGets[url]), CACHE_FOR
          reject request

    if data? and headers?['Content-Type']?.indexOf('json') isnt -1
      data = JSON.stringify data

    request.send data

  if method is 'GET'
    cachedGets[url] = promise

  promise
