Emitter = require './emitter'
mergeInto = require './merge-into'

module.exports = class Model extends Emitter
  _ignoredKeys: []
  _changedKeys: null
  _willChangeTimeout: NaN

  constructor: (configs...) ->
    super
    @_changedKeys = []
    mergeInto this, configs...
    @emit 'create'

  update: (changeSet = {}) ->
    for own key, value of changeSet
      unless key in @_changedKeys
        @_changedKeys.push key
      if typeof value is 'function'
        value = value()
      @[key] = value
    unless isNaN @_willChangeTimeout
      clearTimeout @_willChangeTimeout
    @_willChangeTimeout = setTimeout @_triggerBatchChange
    this

  _triggerBatchChange: =>
    @emit 'change'
    @_willChangeTimeout = NaN

  hasUnsavedChanges: ->
    @_changedKeys.length isnt 0

  toJSON: ->
    result = {}
    for own key, value of this when key.charAt(0) isnt '_' and key not in @_ignoredKeys
      result[key] = value
    result
