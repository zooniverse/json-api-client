Emitter = require './emitter'
mergeInto = require './merge-into'

isIndex = (string) ->
  integer = parseInt string, 10
  integer.toString(10) is string and not isNaN integer

removeUnderscoredKeys = (target) ->
  if Array.isArray target
    (removeUnderscoredKeys value for value in target)
  else if target? and typeof target is 'object'
    results = {}
    for key, value of target when key.charAt(0) isnt '_'
      results[key] = removeUnderscoredKeys value
    results
  else
    target

module.exports = class Model extends Emitter
  _changedKeys: null

  constructor: (configs...) ->
    super
    @_changedKeys = []
    mergeInto this, configs...
    @emit 'create'

  update: (changeSet = {}) ->
    if typeof changeSet is 'string'
      for key in arguments when key not in @_changedKeys
        @_changedKeys.push arguments...
    else
      for own key, value of changeSet
        path = key.split '.'
        rootKey = path[0]
        base = this
        until path.length is 1
          base[path[0]] ?= if isIndex path[1]
            []
          else
            {}

          base = base[path.shift()]
        lastKey = path.shift()
        if value is undefined
          if Array.isArray base
            base.splice lastKey, 1
          else
            delete base[lastKey]
        else
          base[lastKey] = value
        unless rootKey in @_changedKeys
          @_changedKeys.push rootKey
    @emit 'change'
    this

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    removeUnderscoredKeys this

  destroy: ->
    @_changedKeys.splice 0
    super
