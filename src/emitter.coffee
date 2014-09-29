module.exports = class Emitter
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
