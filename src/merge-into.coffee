module.exports = ->
  for argument in Array::slice.call arguments, 1 when argument?
    for own key, value of argument
      arguments[0][key] = value
  arguments[0]
