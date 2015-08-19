request = require 'superagent'

cachedGets = {}

makeHTTPRequest = (method, url, data, headers, modify) ->
  originalArguments = Array::slice.call arguments # In case we need to retry

  method = method.toLowerCase()

  promise = new Promise (resolve, reject) ->
    req = switch method
            when 'get' then request.get(url).query(data)
            when 'head' then request.head(url).query(data)
            when 'put' then request.put(url).send(data)
            when 'post' then request.post(url).send(data)
            when 'delete' then request.del(url)

    req = req.withCredentials()
      .set(headers || {})

    req = modify request if modify?

    req.end (err, response) ->
      if err?.status is 408
        makeHTTPRequest.apply null, originalArguments
          .then resolve
          .catch reject
      else if err?
        reject err
      else
        resolve response

  promise

module.exports = makeHTTPRequest
