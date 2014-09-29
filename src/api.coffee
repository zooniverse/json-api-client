# We'll export everything in this object.
api = {}


# And we'll export some utilities for dev and testing.
api._util = {}


# This is a pretty standard merge function.
# Merge properties of all arguements into the first.
mergeInto = ->
  for argument in Array::slice.call arguments, 1
    for key, value of argument
      arguments[0][key] = value

mergeInto api._util, {mergeInto}


# Make a raw, non-API specific HTTP request.
makeHTTPRequest = (method, url, data, headers) ->
  new Promise (resolve, reject) ->
    request = new XMLHttpRequest
    request.open method, encodeURI url

    if headers?
      for header, value of headers
        request.setRequestHeader header, value

    request.onreadystatechange = (e) ->
      if @readyState is @DONE
        if 200 <= this.status < 300
          resolve request
        else if 400 <= this.status < 600
          reject new Error request.responseText

    request.send JSON.stringify data

mergeInto api._util, {makeHTTPRequest}


# Get a value from a path in an object.
fromObject = (root, segments...) ->
  until segments.length is 0
    root = root[segments.shift()]
  root

mergeInto api._util, {fromObject}


# Turn a JSON-API "href" template into a usable URL.
PLACEHOLDERS_PATTERN = /{(.+?)}/g
applyHREF = (href, context) ->
  href.replace PLACEHOLDERS_PATTERN, (_, match) ->
    path = match.split '.'
    value = fromObject context, path
    if Array.isArray value
      value = value.join ','
    unless typeof value is 'string'
      throw new Error "Value for '#{match}' in '#{href}' should be a string."
    value

mergeInto api._util, {applyHREF}

jsonAPI =
  _types: {}

  _handleLink: (type, attribute, href, attributeType) ->
    unless jsonAPI._types[type]?
      jsonAPI._handleNewType type

    jsonAPI._types[type]._links[attributeType] ?= {}
    if href?
      jsonAPI._types[type]._links[attributeType].href = href
    if attributeType?
      jsonAPI._types[type]._links[attributeType].type = attribute

  _handleNewType: (type) ->
    jsonAPI._types[type] = new ResourceType type

  _processNewResourceData = (data, implicitType) ->
    typeName = data.type ? implicitType

    unless typeName?
      throw new Error "Tried to create a resource with no type: #{JSON.stringify data}"

    unless typeName of jsonAPI._types
      jsonAPI._handleNewType typeName

    jsonAPI._types[typeName]._addResource data

    jsonAPI._types[typeName].get data.id # Return a promise.

  _processResponse: (request) ->
    response = JSON.parse request.responseText

    if 'errors' of response
      "TODO!"

    if 'links' of response
      for typeAndAttribute, link of response.links
        [type, attribute] = typeAndAttribute.split '.'
        if typeof link is 'string'
          href = link
        else
          {href, type: attributeType} = link

        jsonAPI._handleLink type, attribute, href, attributeType

    if 'linked' of response
      for type of response.linked
        for data in [].concat response.linked[type]
          api._processNewResourceData data, type

    if 'meta' of response
      "# TODO: No idea!"

    primaryResources = []

    if 'data' of response
      primaryResources = primaryResources.concat response.data

    for type, resources of response when type not in ['links', 'linked', 'meta', 'data']
      primaryResources = primaryResources.concat resources

    for data in primaryResources
      api._processNewResourceData data

    primaryResources

class Emitter
  _callbacks: null

  constructor: ->
    @_callbacks = {}

  listen: (signal, callback) ->
    @_callbacks[signal] ?= []
    @_callbacks[signal].push callback

  stopListening: (signal, callback) ->
    if signal?
      if @_callbacks[signal]?
        if callback?
          if Array.isArray callback
            # Array-style callbacks need not be the exact same object.
            index = -1
            for handler, i in @_callbacks[signal] by -1 when Array.isArray(handler) and callback.length is handler.length
              if (null for item, j in callback when handler[j] is item).length is callback.length
                index = i
                break
          else
            index = @_callbacks[signal].lastIndexOf callback
          unless index is -1
            @_callbacks[signal].splice index, 1
        else
          @_callbacks[signal].splice 0
    else
      @stopListening signal for signal of @_callbacks

  emit: (signal, payload...) ->
    console?.log 'Emitting', signal, JSON.stringify(payload), @_callbacks[signal]?.length
    if signal of @_callbacks
      for callback in @_callbacks[signal]
        @_callHandler callback, payload

  _callHandler: (handler, args) ->
    if Array.isArray handler
      [context, handler, boundArgs...] = handler
      if typeof handler is 'string'
        handler = context[handler]
    else
      boundArgs = []
    handler.apply context, boundArgs.concat args

mergeInto jsonAPI, {Emitter}


class Resource extends Emitter
  _type: null

  constructor: (config...) ->
    mergeInto this, config... if config?

    # Override the type if its present in the initial data.
    if @type?
      unless ResourceType._all[@type]?
        new ResourceType @type

      unless @_type is ResourceType._all[@type]
        console?.warn "Overriding resource type '#{@_type.name}' to '#{@type}'. Maybe something weird happened.", this
        @_type = ResourceType._all[@type]

    console?.log "Created resource: #{@_type.name} #{@id}", this
    @emit 'create'

  emit: (signal, payload) ->
    super
    @_type._handleResourceEmission this, arguments...

  _urlPromise = null
  _getURL: ->
    if @href?
      Promise.resolve @href
    else
      @_urlPromise ?= @_type._getURL().then (url) ->
        [url, @id].join '/'
      @_urlPromise

  update: (changes...) ->
    mergeInto this, changes...
    @emit 'change'

  # Get a promise for an attribute referring to (an)other resource(s).
  attr: (attribute) ->
    if attr of this
      console?.warn "No need to access a non-linked attribute via attr: #{attribute}", this
      Promise.resolve @[attribute]
    else if attribute of @links
      @_getLink attribute, @links[attribute]
    else
      Promise.reject new Error "No attribute #{attribute} of #{@_type.name} resource"

  _getLink: (name, link) ->
    if typeof link is 'string' or Array.isArray link
      ids = link
      href = @_type.links[name]
      context = {}
      context[@_type.name] = this
      href = applyHREF href, context
      @_type._getByIDs ids, href

    else if link?
      # It's a collection object.
      {href, ids, type} = link
      unless type of ResourceType._all
        new ResourceType type
      ResourceType._all[type]._getByIDs ids, href

    else
      # It exists, but it's blank.
      Promise.resolve null

  save: ->
    @emit 'will-save'
    save = if @id?
      @_getURL().then (url) =>
        api.put url, this
    else
      @_type._getURL().then (url) =>
        api.post url, this

    save.then (results) =>
      @update results
      @emit 'save'

  delete: ->
    @emit 'will-delete'
    deletion = if @id?
      @_getURL().then (url) ->
        api.delete url
    else
      Promise.resolve()

    deletion.then =>
      @emit 'delete'

  _matchesQuery: (query) ->
    matches = true
    for param, value of query
      if @[param] isnt value
        matches = false
        break
    matches

  toJSON: ->
    result = {}
    for key, value of this when key.charAt(0) isnt '_'
      result[key] = value
    result

mergeInto jsonAPI, {Resource}


class ResourceType extends Emitter
  @_all: {}

  name: ''

  _incomingResources: null
  _resourcePromises: null

  links: null

  constructor: (@name, config...) ->
    console?.log 'Defining a new resource type:', @name
    mergeInto this, config... if config?
    @_incomingResources ?= {}
    @_resourcePromises ?= {}
    @links ?= {}
    ResourceType._all[@name] = this

  _urlPromise = null
  _getURL: ->
    @_urlPromise ?= api._entryPoints.then (entryPoints) =>
      entryPoints[@name]
    @_urlPromise

  queryLocal: (query) ->
    Promise.all(resourcePromise for id, resourcePromise of @_resourcePromises).then (resources) ->
      resource for resource in resources when resource?._matchesQuery query

  get: ->
    getting = if typeof arguments[0] is 'string' or Array.isArray arguments[0]
      @_getByIDs arguments...
    else
      @_getByQuery arguments...

    getting.then (response) ->
      @_handleResponse response

  # Given a string, return a promise for that resource.
  # Given an array, return an array of promises for those resources.
  _getByIDs: (ids) ->
    if typeof ids is 'string'
      onlyOneID = true
      ids = [ids]

    # Only request things we don't have or don't already have a request out for.
    incoming = (id for id in ids when (not @_incomingResources[id]?) and (not @_resourcePromises[id]?))

    if incoming.length is 0
      @_returnFromGet ids, onlyOneID
    else
      for id in incoming
        @_incomingResources[id] = Promise.defer()
        @_resourcePromises[id] = @_incomingResources[id].promise

      @_getURL().then (url) =>
        api.get([url, incoming.join ','].join '/').then =>
          @_returnFromGet ids, onlyOneID

  _returnFromGet: (ids, onlyOneID) ->
    resourcePromises = (@_resourcePromises[id] for id in ids)

    if onlyOneID
      resourcePromises[0]
    else
      Promise.all resourcePromises

  _getByQuery: (query, limit = Infinity) ->
    @queryLocal(query).then (existing) =>
      if existing.length >= limit
        existing
      else
        needed = limit - existing.length
        @_getURL().then (url) =>
          api.get(url, mergeInto limit: needed, query).then (response) =>
            @_handleResponseSideEffects response
            fetched = for data in response.data ? response[@name]
              if @_resourcePromises[data.id]?
                # It was created between when we checked and we got this response.
                @_resourcePromises[data.id].then (resource) ->
                  resource.update data
              else
                @_resourcePromises[data.id] = Promise.resolve new Resource data, _type: this
              @_resourcePromises[data.id]

            Promise.all existing.concat fetched

  _addResource: (data) ->
    resource = new Resource data, _type: this
    @_incomingResources[data.id]?.resolve resource
    if data.id of @_incomingResources
      @_incomingResources[data.id] = null

  _handleResourceEmission: (resource, signal, payload) ->
    @emit 'change'

mergeInto jsonAPI, {ResourceType}


mergeInto api, {jsonAPI}


mergeInto api,
  # These are configurable by setting up globals.
  host: ZOONIVERSE_API_HOST ? 'http://panoptes.zooniverse.org'
  root: ZOONIVERSE_API_ROOT ? '/api'
  version: ZOONIVERSE_API_VERSION ? 1

  _request: (method, path, data) ->
    url = api.host + api.root + path

    headers =
      'Content-Type': 'application/vnd.api+json'
      'Accept': "application/vnd.api+json; version=#{api.version}"

    makeHTTPRequest(method, url, data, headers).then api._processResponse, api._processResponse

  post: ->
    api._request 'POST', arguments...

  get: ->
    api._request 'GET', arguments...

  put: ->
    api._request 'PUT', arguments...

  delete: ->
    api._request 'DELETE', arguments...


# Fetch endpoints for known resource types.
# NOTE: This is not yet implemented on the back end.
# api._entryPoints: = api.get('/').then ({links}) ->
#   for type of links
#     api[type] ?= new ResourceType type
#   links
# Temporarily:
api._entryPoints = Promise.resolve
  projects: '/projects'


# This will match the CSRF token in a string of HTML.
CSRF_TOKEN_PATTERN = do ->
  NAME_ATTR = '''name=['"]csrf-token['"]'''
  CONTENT_ATTR = '''content=['"](.+)['"]'''
  ///#{NAME_ATTR}\s*#{CONTENT_ATTR}|#{CONTENT_ATTR}\s*#{NAME_ATTR}///

api.auth =
  currentSession: null

  _getAuthToken: ->
    makeHTTPRequest('GET', api.host + '/users/sign_up').then (request) ->
      [_, authToken1, authToken2] = request.responseText.match CSRF_TOKEN_PATTERN
      authToken = authToken1 ? authToken2
      console?.log 'Got auth token', authToken
      authToken

  register: ({login, email, password, passwordConfirmation}) ->
    api.auth.currentSession = @_getAuthToken().then (authToken) ->
      # registration = api.post '/users',
      #   login: login
      #   email: email
      #   password: password
      #   password_confirmation: passwordConfirmation
      #   authenticity_token: authToken

      # registration.then (user) ->
      #   console?.info 'Created user', user

      # registration

    signIn: ({login, password}) ->
    #   api.auth.currentSession = api.post '/sessions', {login, password}

    signOut: ->
    #   api.auth.currentSession.then (session) ->
    #     session.delete()


api.log = (promise) ->
  promise.then console?.info.bind(console), console?.error.bind(console)

module?.exports = api
window?.zooniverse = api
