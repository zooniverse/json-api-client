DEFAULT_SIGNAL = 'change'

arraysMatch = (array1, array2) ->
  matches = (i for item, i in array1 when array2[i] is item)
  array1.length is array2.length is matches.length

callHandler = (handler, payload) ->
  # Handlers can be in the form [context, function or method name, bound arguments...]
  if Array.isArray handler
    [context, handler, boundArgs...] = handler
    if typeof handler is 'string'
      handler = context[handler]
  else
    boundArgs = []
  handler.apply context, boundArgs.concat payload
  return

module.exports = class Emitter
  _callbacks: null

  constructor: ->
    @_callbacks = {}

  listen: ([signal]..., callback) ->
    signal ?= DEFAULT_SIGNAL
    @_callbacks[signal] ?= []
    @_callbacks[signal].push callback
    this

  stopListening: ([signal]..., callback) ->
    signal ?= DEFAULT_SIGNAL
    if @_callbacks[signal]?
      if callback?
        if Array.isArray callback
          # Array-style callbacks need not be the exact same object.
          index = -1
          for handler, i in @_callbacks[signal] by -1 when Array.isArray handler
            if arraysMatch callback, handler
              index = i
              break
        else
          index = @_callbacks[signal].lastIndexOf callback
        unless index is -1
          @_callbacks[signal].splice index, 1
      else
        @_callbacks[signal].splice 0
    this

  emit: (signal, payload...) ->
    signal ?= DEFAULT_SIGNAL
    if signal of @_callbacks
      for callback in @_callbacks[signal]
        callHandler callback, payload
    this

  destroy: ->
    @emit 'destroy'
    for signal of @_callbacks
      for callback in @_callbacks[signal]
        @stopListening signal, callback
    return
