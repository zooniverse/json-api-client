request = require 'superagent'
DEFAULT_HEADERS = require './default-headers'
normalizeUrl = require 'normalizeurl'

if request.agent?
  request = request.agent()

makeHTTPRequest = (method, url, data, headers = {}, modify) ->
  originalArguments = Array::slice.call arguments # In case we need to retry
  method = method.toLowerCase()
  url = normalizeUrl url

  new Promise (resolve, reject) ->
    req = switch method
      when 'get' then request.get(url).query data
      when 'head' then request.head(url).query data
      when 'put' then request.put(url).send data
      when 'post' then request.post(url).send data
      when 'delete' then request.del(url)

    req = req.set headers

    if req.withCredentials?
      req = req.withCredentials()

    if modify?
      console.warn 'Request modification is a sloppy idea; is anything actually doing this? Figure out something else.'
      req = modify req

    req.end (error, response) ->
      if error?.status is 408
        makeHTTPRequest.apply null, originalArguments
      else if error?
        reject response
      else
        resolve response

module.exports = makeHTTPRequest
