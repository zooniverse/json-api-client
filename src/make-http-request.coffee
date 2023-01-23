superagent = require 'superagent'
DEFAULT_HEADERS = require './default-headers'
normalizeUrl = require 'normalizeurl'

getsInProgress = {}

# Superagent will only auto-parse responses from a Content-Type header it recognizes.
# Add the Accept in use by the JSON API spec, which is what will be sent back from the server.
parseJSON = superagent.parse['application/json']
superagent.parse[DEFAULT_HEADERS['Accept']] = parseJSON

# isolate the credential requests from the superagent singleton
# via the agent() to ensure correct credentials for both request types
# http://visionmedia.github.io/superagent/#agents-for-global-state
request = superagent
credentialRequest = superagent
if superagent.agent?
  request = superagent.agent()
  credentialRequest = superagent.agent()
  if credentialRequest.withCredentials?
    credentialRequest = credentialRequest.withCredentials()

makeHTTPRequest = (method, url, data, headers = {}, query) ->
  makeRequest(request, method, url, data, headers, query)

makeCredentialHTTPRequest = (method, url, data, headers = {}, query) ->
  makeRequest(credentialRequest, method, url, data, headers, query)

makeRequest = (request, method, url, data, headers, query) ->
  originalArguments = Array::slice.call arguments # In case we need to retry
  method = method.toLowerCase()
  url = normalizeUrl url

  if method is 'get'
    for key, value of data when Array.isArray value
      data[key] = value.join ','

    requestID = "#{url} #{JSON.stringify data}"
    if getsInProgress[requestID]?
      return getsInProgress[requestID]

  promisedRequest = new Promise (resolve, reject) ->
    req = switch method
      when 'get' then request.get(url).query data
      when 'head' then request.head(url).query data
      when 'put' then request.put(url).query(query).send data
      when 'post' then request.post(url).query(query).send data
      when 'delete' then request.del(url).query(query).query data

    req = req.set headers

    req.end (error, response) ->
      delete getsInProgress[requestID]
      if error?.status is 408
        resolve makeHTTPRequest.apply null, originalArguments
      else if error?
        # Prefer rejecting with the response, since it'll have more specific information.
        # TODO: Reject with the error as expected and access the response through `error.response` in the handler.
        reject response ? error
      else
        resolve response

  if method is 'get'
    getsInProgress[requestID] = promisedRequest

  promisedRequest

module.exports = { makeHTTPRequest, makeCredentialHTTPRequest }
