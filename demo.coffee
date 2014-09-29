JSONAPIClient = require './src/json-api-client'

proxyWithCORS = (url) ->
  split = url.split '://'
  withoutPrototcol = split[1] ? url
  'http://www.corsproxy.com/' + withoutPrototcol

window.api = new JSONAPIClient proxyWithCORS 'http://restpack-serializer-sample.herokuapp.com/api/v1'
window.artists = window.api.createType 'artists'
window.artists.get('1').then (artist) ->
  console.info 'Got artist', artist
  console.info artist.attr('albums').then console.info.bind(console), console.error.bind(console)
