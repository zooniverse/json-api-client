!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Emitter, print,
  __slice = [].slice;

print = _dereq_('./print');

module.exports = Emitter = (function() {
  Emitter.prototype._callbacks = null;

  function Emitter() {
    this._callbacks = {};
  }

  Emitter.prototype.listen = function(signal, callback) {
    var _base;
    if ((_base = this._callbacks)[signal] == null) {
      _base[signal] = [];
    }
    return this._callbacks[signal].push(callback);
  };

  Emitter.prototype.stopListening = function(signal, callback) {
    var handler, i, index, item, j, _i, _ref, _results;
    if (signal != null) {
      if (this._callbacks[signal] != null) {
        if (callback != null) {
          if (Array.isArray(callback)) {
            index = -1;
            _ref = this._callbacks[signal];
            for (i = _i = _ref.length - 1; _i >= 0; i = _i += -1) {
              handler = _ref[i];
              if (Array.isArray(handler) && callback.length === handler.length) {
                if (((function() {
                  var _j, _len, _results;
                  _results = [];
                  for (j = _j = 0, _len = callback.length; _j < _len; j = ++_j) {
                    item = callback[j];
                    if (handler[j] === item) {
                      _results.push(null);
                    }
                  }
                  return _results;
                })()).length === callback.length) {
                  index = i;
                  break;
                }
              }
            }
          } else {
            index = this._callbacks[signal].lastIndexOf(callback);
          }
          if (index !== -1) {
            return this._callbacks[signal].splice(index, 1);
          }
        } else {
          return this._callbacks[signal].splice(0);
        }
      }
    } else {
      _results = [];
      for (signal in this._callbacks) {
        _results.push(this.stopListening(signal));
      }
      return _results;
    }
  };

  Emitter.prototype.emit = function() {
    var callback, payload, signal, _i, _len, _ref, _ref1, _results;
    signal = arguments[0], payload = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    print.log('Emitting', signal, JSON.stringify(payload), (_ref = this._callbacks[signal]) != null ? _ref.length : void 0);
    if (signal in this._callbacks) {
      _ref1 = this._callbacks[signal];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        callback = _ref1[_i];
        _results.push(this._callHandler(callback, payload));
      }
      return _results;
    }
  };

  Emitter.prototype._callHandler = function(handler, args) {
    var boundArgs, context, _ref;
    if (Array.isArray(handler)) {
      _ref = handler, context = _ref[0], handler = _ref[1], boundArgs = 3 <= _ref.length ? __slice.call(_ref, 2) : [];
      if (typeof handler === 'string') {
        handler = context[handler];
      }
    } else {
      boundArgs = [];
    }
    return handler.apply(context, boundArgs.concat(args));
  };

  return Emitter;

})();



},{"./print":5}],2:[function(_dereq_,module,exports){
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, Type, makeHTTPRequest, mergeInto, print,
  __slice = [].slice;

print = _dereq_('./print');

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

DEFAULT_TYPE_AND_ACCEPT = {
  'Content-Type': 'application/vnd.api+json',
  'Accept': "application/vnd.api+json"
};

module.exports = JSONAPIClient = (function() {
  var method, _fn, _i, _len, _ref;

  JSONAPIClient.prototype.root = '';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype.types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers;
    if (this.headers == null) {
      this.headers = {};
    }
    this.types = {};
    print.info('Created a new JSON-API client at', this.root);
  }

  JSONAPIClient.prototype.request = function(method, url, data, additionalHeaders) {
    var headers;
    print.info('Making a', method, 'request to', url);
    headers = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, additionalHeaders);
    return makeHTTPRequest(method, this.root + url, data, headers).then(this.processResponseTo.bind(this));
  };

  _ref = ['get', 'post', 'put', 'delete'];
  _fn = function(method) {
    return JSONAPIClient.prototype[method] = function() {
      return this.request.apply(this, [method.toUpperCase()].concat(__slice.call(arguments)));
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    method = _ref[_i];
    _fn(method);
  }

  JSONAPIClient.prototype.processResponseTo = function(request) {
    var attribute, attributeType, href, link, primaryResults, resource, resources, response, type, typeAndAttribute, _j, _k, _len1, _len2, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    response = JSON.parse(request.responseText);
    print.log('Processing response', response);
    if ('meta' in response) {
      'TODO: No idea yet!';
    }
    if ('links' in response) {
      _ref1 = response.links;
      for (typeAndAttribute in _ref1) {
        link = _ref1[typeAndAttribute];
        _ref2 = typeAndAttribute.split('.'), type = _ref2[0], attribute = _ref2[1];
        if (typeof link === 'string') {
          href = link;
        } else {
          href = link.href, attributeType = link.type;
        }
        this.handleLink(type, attribute, href, attributeType);
      }
    }
    if ('linked' in response) {
      _ref3 = response.linked;
      for (type in _ref3) {
        resources = _ref3[type];
        print.log('Got', resources != null ? resources : 1, 'linked', type, 'resources.');
        if (this.types[type] == null) {
          this.createType(type);
        }
        _ref4 = [].concat(resources);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          resource = _ref4[_j];
          this.types[type].createResource(resource);
        }
      }
    }
    if ('data' in response) {
      print.log('Got a top-level "data" collection of', (_ref5 = response.data.length) != null ? _ref5 : 1);
      primaryResults = (function() {
        var _k, _len2, _ref6, _results;
        _ref6 = [].concat(response.data);
        _results = [];
        for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
          resource = _ref6[_k];
          if (this.types[resource.type] == null) {
            this.createType(response.type);
          }
          _results.push(this.types[type].createResource(resource));
        }
        return _results;
      }).call(this);
    } else {
      primaryResults = [];
      for (type in response) {
        resources = response[type];
        if (!(type !== 'links' && type !== 'linked' && type !== 'meta' && type !== 'data')) {
          continue;
        }
        print.log('Got a top-level', type, 'collection of', (_ref6 = resources.length) != null ? _ref6 : 1);
        if (this.types[type] == null) {
          this.createType(type);
        }
        _ref7 = [].concat(resources);
        for (_k = 0, _len2 = _ref7.length; _k < _len2; _k++) {
          resource = _ref7[_k];
          primaryResults.push(this.types[type].createResource(resource, type));
        }
      }
    }
    print.info('Primary resources:', primaryResults);
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype.handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var _base;
    if (this.types[typeName] == null) {
      this.createType(typeName);
    }
    if ((_base = this.types[typeName].links)[attributeTypeName] == null) {
      _base[attributeTypeName] = {};
    }
    if (hrefTemplate != null) {
      this.types[typeName].links[attributeTypeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return this.types[typeName].links[attributeTypeName].type = attributeName;
    }
  };

  JSONAPIClient.prototype.createType = function(name) {
    return new Type({
      name: name,
      apiClient: this
    });
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./type":7}],3:[function(_dereq_,module,exports){
var print;

print = _dereq_('./print');

module.exports = function(method, url, data, headers, modify) {
  print.info('Requesting', method, url, data);
  return new Promise(function(resolve, reject) {
    var header, modifications, request, value;
    request = new XMLHttpRequest;
    request.open(method, encodeURI(url));
    request.withCredentials = true;
    if (headers != null) {
      for (header in headers) {
        value = headers[header];
        request.setRequestHeader(header, value);
      }
    }
    if (modify != null) {
      modifications = modify(request);
    }
    request.onreadystatechange = function(e) {
      var key, _ref;
      print.log('Ready state:', ((function() {
        var _results;
        _results = [];
        for (key in request) {
          value = request[key];
          if (value === request.readyState && key !== 'readyState') {
            _results.push(key);
          }
        }
        return _results;
      })())[0]);
      if (request.readyState === request.DONE) {
        print.log('Done; status is', request.status);
        if ((200 <= (_ref = request.status) && _ref < 300)) {
          return resolve(request);
        } else {
          return reject(request);
        }
      }
    };
    return request.send(JSON.stringify(data));
  });
};



},{"./print":5}],4:[function(_dereq_,module,exports){
module.exports = function() {
  var argument, key, value, _i, _len, _ref;
  _ref = Array.prototype.slice.call(arguments, 1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    argument = _ref[_i];
    if (argument != null) {
      for (key in argument) {
        value = argument[key];
        arguments[0][key] = value;
      }
    }
  }
  return arguments[0];
};



},{}],5:[function(_dereq_,module,exports){
var LOG_LEVEL, print, _ref, _ref1,
  __slice = [].slice;

LOG_LEVEL = parseFloat((_ref = (_ref1 = location.search.match(/json-api-log=(\d+)/)) != null ? _ref1[1] : void 0) != null ? _ref : 0);

print = function() {
  var color, level, messages;
  level = arguments[0], color = arguments[1], messages = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  if (LOG_LEVEL >= level) {
    return console.log.apply(console, ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"].concat(__slice.call(messages)));
  }
};

module.exports = {
  log: print.bind(null, 4, 'gray'),
  info: print.bind(null, 3, 'blue'),
  warn: print.bind(null, 2, 'orange'),
  error: print.bind(null, 1, 'red')
};



},{}],6:[function(_dereq_,module,exports){
var Emitter, Resource, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype.id = '';

  Resource.prototype.href = '';

  Resource.prototype.type = '';

  Resource.prototype._type = null;

  Resource.prototype.created_at = '';

  Resource.prototype.updated_at = '';

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    print.info("Created resource: " + this._type.name + " " + this.id, this);
    this.emit('create');
  }

  Resource.prototype.attr = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      print.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      return Promise.resolve(this[attribute]);
    } else if ((this.links != null) && attribute in this.links) {
      print.log('Link of resource');
      return this._getLink(attribute, this.links[attribute]);
    } else if (attribute in this._type.links) {
      print.log('Link of type');
      return this._getLink(attribute, this._type.links[attribute]);
    } else {
      print.error('Not a link at all');
      return Promise.reject(new Error("No attribute " + attribute + " of " + this._type.name + " resource"));
    }
  };

  Resource.prototype._getLink = function(name, link) {
    var context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type.links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        href = applyHREF(href, context);
        return this._type.apiClient.get(href);
      } else if (type != null) {
        type = this._type.apiClient.types[type];
        return type.get(ids);
      }
    } else if (link != null) {
      print.log('Linked by collection object', link);
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        print.warn('HREF', href);
        href = this.applyHREF(href, context);
        return this._type.apiClient.get(href);
      } else if ((type != null) && (ids != null)) {
        type = this._type.apiClient.types[type];
        return type.get(ids);
      }
    } else {
      print.log('Linked, but blank');
      return Promise.resolve(null);
    }
  };

  Resource.prototype.PLACEHOLDERS_PATTERN = /{(.+?)}/g;

  Resource.prototype.applyHREF = function(href, context) {
    return href.replace(this.PLACEHOLDERS_PATTERN, function(_, path) {
      var segment, segments, value, _ref, _ref1;
      segments = path.split('.');
      print.warn('Segments', segments);
      value = context;
      while (segments.length !== 0) {
        segment = segments.shift();
        value = (_ref = value[segment]) != null ? _ref : (_ref1 = value.links) != null ? _ref1[segment] : void 0;
      }
      print.warn('Value', value);
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (typeof value !== 'string') {
        throw new Error("Value for '" + path + "' in '" + href + "' should be a string.");
      }
      return value;
    });
  };

  Resource.prototype.update = function() {
    var changes;
    changes = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    mergeInto.apply(null, [this].concat(__slice.call(changes)));
    return this.emit('change');
  };

  Resource.prototype.save = function() {
    var save;
    this.emit('will-save');
    save = this.id ? this._type.apiClient.put(this.getURL(), this) : this._type.apiClient.post(this._type.getURL(), this);
    return save.then((function(_this) {
      return function(results) {
        _this.update(results);
        return _this.emit('save');
      };
    })(this));
  };

  Resource.prototype["delete"] = function() {
    var deletion;
    this.emit('will-delete');
    deletion = this.id ? this._type.apiClient["delete"](this.getURL()) : Promise.resolve();
    return deletion.then((function(_this) {
      return function() {
        return _this.emit('delete');
      };
    })(this));
  };

  Resource.prototype.matchesQuery = function(query) {
    var matches, param, value;
    matches = true;
    for (param in query) {
      value = query[param];
      if (this[param] !== value) {
        matches = false;
        break;
      }
    }
    return matches;
  };

  Resource.prototype.emit = function(signal, payload) {
    var _ref;
    Resource.__super__.emit.apply(this, arguments);
    return (_ref = this._type)._handleResourceEmission.apply(_ref, [this].concat(__slice.call(arguments)));
  };

  Resource.prototype.getURL = function() {
    return this.href || [this._type.getURL(), this.id].join('/');
  };

  Resource.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    result[this._type.name] = {};
    for (key in this) {
      value = this[key];
      if (key.charAt(0) !== '_' && !(key in this.constructor.prototype)) {
        result[this._type.name][key] = value;
      }
    }
    return result;
  };

  return Resource;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5}],7:[function(_dereq_,module,exports){
var Emitter, Resource, Type, defer, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

Resource = _dereq_('./resource');

defer = function() {
  var deferral;
  deferral = {};
  deferral.promise = new Promise(function(resolve, reject) {
    deferral.resolve = resolve;
    return deferral.reject = reject;
  });
  return deferral;
};

module.exports = Type = (function(_super) {
  __extends(Type, _super);

  Type.prototype.name = '';

  Type.prototype.apiClient = null;

  Type.prototype.links = null;

  Type.prototype.deferrals = null;

  Type.prototype.resourcePromises = null;

  function Type() {
    var configs;
    configs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Type.__super__.constructor.apply(this, arguments);
    if (configs != null) {
      mergeInto.apply(null, [this].concat(__slice.call(configs)));
    }
    print.info('Defining a new resource type:', this.name);
    if (this.links == null) {
      this.links = {};
    }
    if (this.deferrals == null) {
      this.deferrals = {};
    }
    if (this.resourcePromises == null) {
      this.resourcePromises = {};
    }
    this.apiClient.types[this.name] = this;
  }

  Type.prototype.getURL = function() {
    return '/' + this.name;
  };

  Type.prototype.queryLocal = function(query) {
    var id, resourcePromise;
    return Promise.all((function() {
      var _ref, _results;
      _ref = this.resourcePromises;
      _results = [];
      for (id in _ref) {
        resourcePromise = _ref[id];
        _results.push(resourcePromise);
      }
      return _results;
    }).call(this)).then(function(resources) {
      var resource, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = resources.length; _i < _len; _i++) {
        resource = resources[_i];
        if (resource != null ? resource.matchesQuery(query) : void 0) {
          _results.push(resource);
        }
      }
      return _results;
    });
  };

  Type.prototype.waitingFor = function(id) {
    return this.deferrals[id] != null;
  };

  Type.prototype.has = function(id) {
    return (this.resourcePromises[id] != null) && (this.deferrals[id] == null);
  };

  Type.prototype.get = function() {
    if (typeof arguments[0] === 'string' || Array.isArray(arguments[0])) {
      return this.getByIDs.apply(this, arguments);
    } else {
      return this.getByQuery.apply(this, arguments);
    }
  };

  Type.prototype.getByIDs = function(ids, options) {
    var givenString, id, incoming, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    if (typeof ids === 'string') {
      givenString = true;
      ids = [ids];
    }
    incoming = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (!this.has(id) && !this.waitingFor(id)) {
          _results.push(id);
        }
      }
      return _results;
    }).call(this);
    print.log('Incoming: ', incoming);
    if (incoming.length !== 0) {
      for (_i = 0, _len = incoming.length; _i < _len; _i++) {
        id = incoming[_i];
        this.deferrals[id] = defer();
        this.resourcePromises[id] = this.deferrals[id].promise;
      }
      url = [this.getURL(), incoming.join(',')].join('/');
      print.log('Request for', this.name, 'at', url);
      this.apiClient.get(url, options).then((function(_this) {
        return function(resources) {
          return print.log('Got', _this.name, resources);
        };
      })(this));
    }
    if (givenString) {
      return this.resourcePromises[ids[0]];
    } else {
      return Promise.all((function() {
        var _j, _len1, _results;
        _results = [];
        for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
          id = ids[_j];
          _results.push(this.resourcePromises[id]);
        }
        return _results;
      }).call(this));
    }
  };

  Type.prototype.getByQuery = function(query, limit) {
    if (limit == null) {
      limit = Infinity;
    }
    return this.queryLocal(query).then((function(_this) {
      return function(existing) {
        var params;
        if (existing.length >= limit) {
          return existing;
        } else {
          params = {
            limit: limit - existing.length
          };
          return _this.apiClient.get(_this.getURL(), mergeInto(params, query)).then(function(resources) {
            return Promise.all(existing.concat(resources));
          });
        }
      };
    })(this));
  };

  Type.prototype.createResource = function(data) {
    if (this.waitingFor(data.id)) {
      print.log('Resolving and removing deferral for', this.name, data.id);
      this.deferrals[data.id].resolve(new Resource(data, {
        _type: this
      }));
      this.deferrals[data.id] = null;
    } else if (this.has(data.id)) {
      print.log('The', this.name, 'resource', data.id, 'exists; will update');
      this.get(data.id).then(function(resource) {
        return resource.update(data);
      });
    } else {
      print.log('Creating new', this.name, 'resource', data.id);
      this.resourcePromises[data.id] = Promise.resolve(new Resource(data, {
        _type: this
      }));
    }
    return this.resourcePromises[data.id];
  };

  Type.prototype._handleResourceEmission = function(resource, signal, payload) {
    return this.emit('change');
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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RUFBVixDQUFhLENBQUMsSUFBZCxDQUFtQixTQUFDLFFBQUQsR0FBQTtlQUNqQixRQUFRLENBQUMsTUFBVCxDQUFnQixJQUFoQixFQURpQjtNQUFBLENBQW5CLENBREEsQ0FERztLQUFBLE1BQUE7QUFLSCxNQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsY0FBVixFQUEwQixJQUFDLENBQUEsSUFBM0IsRUFBaUMsVUFBakMsRUFBNkMsSUFBSSxDQUFDLEVBQWxELENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLGdCQUFpQixDQUFBLElBQUksQ0FBQyxFQUFMLENBQWxCLEdBQTZCLE9BQU8sQ0FBQyxPQUFSLENBQW9CLElBQUEsUUFBQSxDQUFTLElBQVQsRUFBZTtBQUFBLFFBQUEsS0FBQSxFQUFPLElBQVA7T0FBZixDQUFwQixDQUQ3QixDQUxHO0tBSkw7V0FZQSxJQUFDLENBQUEsZ0JBQWlCLENBQUEsSUFBSSxDQUFDLEVBQUwsRUFiSjtFQUFBLENBeEVoQixDQUFBOztBQUFBLGlCQXVGQSx1QkFBQSxHQUF5QixTQUFDLFFBQUQsRUFBVyxNQUFYLEVBQW1CLE9BQW5CLEdBQUE7V0FDdkIsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOLEVBRHVCO0VBQUEsQ0F2RnpCLENBQUE7O2NBQUE7O0dBRGtDLFFBWnBDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcblxuICBzdG9wTGlzdGVuaW5nOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBpZiBzaWduYWw/XG4gICAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgICBpZiBBcnJheS5pc0FycmF5IGNhbGxiYWNrXG4gICAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgICBmb3IgaGFuZGxlciwgaSBpbiBAX2NhbGxiYWNrc1tzaWduYWxdIGJ5IC0xIHdoZW4gQXJyYXkuaXNBcnJheShoYW5kbGVyKSBhbmQgY2FsbGJhY2subGVuZ3RoIGlzIGhhbmRsZXIubGVuZ3RoXG4gICAgICAgICAgICAgIGlmIChudWxsIGZvciBpdGVtLCBqIGluIGNhbGxiYWNrIHdoZW4gaGFuZGxlcltqXSBpcyBpdGVtKS5sZW5ndGggaXMgY2FsbGJhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgICB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSAwXG4gICAgZWxzZVxuICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsIGZvciBzaWduYWwgb2YgQF9jYWxsYmFja3NcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIHByaW50LmxvZyAnRW1pdHRpbmcnLCBzaWduYWwsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLCBAX2NhbGxiYWNrc1tzaWduYWxdPy5sZW5ndGhcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIEBfY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcblxuICBfY2FsbEhhbmRsZXI6IChoYW5kbGVyLCBhcmdzKSAtPlxuICAgIGlmIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICBoYW5kbGVyID0gY29udGV4dFtoYW5kbGVyXVxuICAgIGVsc2VcbiAgICAgIGJvdW5kQXJncyA9IFtdXG4gICAgaGFuZGxlci5hcHBseSBjb250ZXh0LCBib3VuZEFyZ3MuY29uY2F0IGFyZ3NcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbm1ha2VIVFRQUmVxdWVzdCA9IHJlcXVpcmUgJy4vbWFrZS1odHRwLXJlcXVlc3QnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5UeXBlID0gcmVxdWlyZSAnLi90eXBlJ1xuXG5ERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCA9XG4gICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuICAnQWNjZXB0JzogXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpTT05BUElDbGllbnRcbiAgcm9vdDogJydcbiAgaGVhZGVyczogbnVsbFxuXG4gIHR5cGVzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMpIC0+XG4gICAgQGhlYWRlcnMgPz0ge31cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzKSAtPlxuICAgIHByaW50LmluZm8gJ01ha2luZyBhJywgbWV0aG9kLCAncmVxdWVzdCB0bycsIHVybFxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QobWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVycykudGhlbiBAcHJvY2Vzc1Jlc3BvbnNlVG8uYmluZCB0aGlzXG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLnRvVXBwZXJDYXNlKCksIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICByZXNwb25zZSA9IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ21ldGEnIG9mIHJlc3BvbnNlXG4gICAgICAnVE9ETzogTm8gaWRlYSB5ZXQhJ1xuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgcmVzcG9uc2UubGlua3NcbiAgICAgICAgW3R5cGUsIGF0dHJpYnV0ZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB7aHJlZiwgdHlwZTogYXR0cmlidXRlVHlwZX0gPSBsaW5rXG5cbiAgICAgICAgQGhhbmRsZUxpbmsgdHlwZSwgYXR0cmlidXRlLCBocmVmLCBhdHRyaWJ1dGVUeXBlXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCByZXNvdXJjZXMgPyAxLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlcy4nXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZSB1bmxlc3MgQHR5cGVzW3Jlc291cmNlLnR5cGVdP1xuICAgICAgICBAdHlwZXNbdHlwZV0uY3JlYXRlUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGUgdW5sZXNzIEB0eXBlc1t0eXBlXT9cbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZSwgdHlwZVxuXG4gICAgcHJpbnQuaW5mbyAnUHJpbWFyeSByZXNvdXJjZXM6JywgcHJpbWFyeVJlc3VsdHNcbiAgICBQcm9taXNlLmFsbCBwcmltYXJ5UmVzdWx0c1xuXG4gIGhhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB1bmxlc3MgQHR5cGVzW3R5cGVOYW1lXT9cbiAgICAgIEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICBAdHlwZXNbdHlwZU5hbWVdLmxpbmtzW2F0dHJpYnV0ZVR5cGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVOYW1lXG5cbiAgY3JlYXRlVHlwZTogKG5hbWUpIC0+XG4gICAgbmV3IFR5cGUgbmFtZTogbmFtZSwgYXBpQ2xpZW50OiB0aGlzXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG4jIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBwcmludC5pbmZvICdSZXF1ZXN0aW5nJywgbWV0aG9kLCB1cmwsIGRhdGFcbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZpY2F0aW9ucyA9IG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgcHJpbnQubG9nICdSZWFkeSBzdGF0ZTonLCAoa2V5IGZvciBrZXksIHZhbHVlIG9mIHJlcXVlc3Qgd2hlbiB2YWx1ZSBpcyByZXF1ZXN0LnJlYWR5U3RhdGUgYW5kIGtleSBpc250ICdyZWFkeVN0YXRlJylbMF1cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgcHJpbnQubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZSAjIGlmIDQwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDYwMFxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICByZXF1ZXN0LnNlbmQgSlNPTi5zdHJpbmdpZnkgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsIkxPR19MRVZFTCA9IHBhcnNlRmxvYXQgbG9jYXRpb24uc2VhcmNoLm1hdGNoKC9qc29uLWFwaS1sb2c9KFxcZCspLyk/WzFdID8gMFxuXG5wcmludCA9IChsZXZlbCwgY29sb3IsIG1lc3NhZ2VzLi4uKSAtPlxuICBpZiBMT0dfTEVWRUwgPj0gbGV2ZWxcbiAgICBjb25zb2xlLmxvZyAnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgNCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgMywgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgMiwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgMSwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIGlkOiAnJ1xuICBocmVmOiAnJ1xuICB0eXBlOiAnJ1xuXG4gIF90eXBlOiBudWxsXG5cbiAgY3JlYXRlZF9hdDogJydcbiAgdXBkYXRlZF9hdDogJydcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZy4uLikgLT5cbiAgICBzdXBlclxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWcuLi4gaWYgY29uZmlnP1xuICAgIHByaW50LmluZm8gXCJDcmVhdGVkIHJlc291cmNlOiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIiwgdGhpc1xuICAgIEBlbWl0ICdjcmVhdGUnXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgYXR0cjogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIHByaW50Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUubGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiB0eXBlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQF90eXBlLmxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLm5hbWV9IHJlc291cmNlXCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBJRChzKSdcbiAgICAgIGlkcyA9IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIGhyZWYgPSBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlIGlmIGxpbms/XG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBjb2xsZWN0aW9uIG9iamVjdCcsIGxpbmtcbiAgICAgICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgaHJlZiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldCBocmVmXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlcy4uLikgLT5cbiAgICBtZXJnZUludG8gdGhpcywgY2hhbmdlcy4uLlxuICAgIEBlbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuICAgIHNhdmUgPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucHV0IEBnZXRVUkwoKSwgdGhpc1xuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucG9zdCBAX3R5cGUuZ2V0VVJMKCksIHRoaXNcblxuICAgIHNhdmUudGhlbiAocmVzdWx0cykgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0c1xuICAgICAgQGVtaXQgJ3NhdmUnXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5kZWxldGUgQGdldFVSTCgpXG4gICAgZWxzZVxuICAgICAgIyBAX3R5cGUucmVtb3ZlUmVzb3VyY2UgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbWF0Y2hlc1F1ZXJ5OiAocXVlcnkpIC0+XG4gICAgbWF0Y2hlcyA9IHRydWVcbiAgICBmb3IgcGFyYW0sIHZhbHVlIG9mIHF1ZXJ5XG4gICAgICBpZiBAW3BhcmFtXSBpc250IHZhbHVlXG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgIG1hdGNoZXNcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkKSAtPlxuICAgIHN1cGVyXG4gICAgQF90eXBlLl9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uIHRoaXMsIGFyZ3VtZW50cy4uLlxuXG4gIGdldFVSTDogLT5cbiAgICBAaHJlZiB8fCBbQF90eXBlLmdldFVSTCgpLCBAaWRdLmpvaW4gJy8nXG5cbiAgdG9KU09OOiAtPlxuICAgIHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W0BfdHlwZS5uYW1lXSA9IHt9XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3Qgb2YgQGNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgICAgcmVzdWx0W0BfdHlwZS5uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIG5hbWU6ICcnXG4gIGFwaUNsaWVudDogbnVsbFxuXG4gIGxpbmtzOiBudWxsXG5cbiAgZGVmZXJyYWxzOiBudWxsXG4gIHJlc291cmNlUHJvbWlzZXM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZ3MuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlncy4uLiBpZiBjb25maWdzP1xuICAgIHByaW50LmluZm8gJ0RlZmluaW5nIGEgbmV3IHJlc291cmNlIHR5cGU6JywgQG5hbWVcbiAgICBAbGlua3MgPz0ge31cbiAgICBAZGVmZXJyYWxzID89IHt9XG4gICAgQHJlc291cmNlUHJvbWlzZXMgPz0ge31cbiAgICBAYXBpQ2xpZW50LnR5cGVzW0BuYW1lXSA9IHRoaXNcblxuICBnZXRVUkw6IC0+XG4gICAgJy8nICsgQG5hbWVcblxuICBxdWVyeUxvY2FsOiAocXVlcnkpIC0+XG4gICAgUHJvbWlzZS5hbGwocmVzb3VyY2VQcm9taXNlIGZvciBpZCwgcmVzb3VyY2VQcm9taXNlIG9mIEByZXNvdXJjZVByb21pc2VzKS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICByZXNvdXJjZSBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzIHdoZW4gcmVzb3VyY2U/Lm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAZGVmZXJyYWxzW2lkXT9cblxuICBoYXM6IChpZCkgLT5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0/IGFuZCBub3QgQGRlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICAjIEdpdmVuIGEgc3RyaW5nLCByZXR1cm4gYSBwcm9taXNlIGZvciB0aGF0IHJlc291cmNlLlxuICAjIEdpdmVuIGFuIGFycmF5LCByZXR1cm4gYW4gYXJyYXkgb2YgcHJvbWlzZXMgZm9yIHRob3NlIHJlc291cmNlcy5cbiAgZ2V0QnlJRHM6IChpZHMsIG9wdGlvbnMpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBuYW1lLCAnYnkgSUQocyknLCBpZHNcbiAgICBpZiB0eXBlb2YgaWRzIGlzICdzdHJpbmcnXG4gICAgICBnaXZlblN0cmluZyA9IHRydWVcbiAgICAgIGlkcyA9IFtpZHNdXG5cbiAgICAjIE9ubHkgcmVxdWVzdCB0aGluZ3Mgd2UgZG9uJ3QgaGF2ZSBvciBkb24ndCBhbHJlYWR5IGhhdmUgYSByZXF1ZXN0IG91dCBmb3IuXG4gICAgaW5jb21pbmcgPSAoaWQgZm9yIGlkIGluIGlkcyB3aGVuIG5vdCBAaGFzKGlkKSBhbmQgbm90IEB3YWl0aW5nRm9yKGlkKSlcbiAgICBwcmludC5sb2cgJ0luY29taW5nOiAnLCBpbmNvbWluZ1xuXG4gICAgdW5sZXNzIGluY29taW5nLmxlbmd0aCBpcyAwXG4gICAgICBmb3IgaWQgaW4gaW5jb21pbmdcbiAgICAgICAgQGRlZmVycmFsc1tpZF0gPSBkZWZlcigpXG4gICAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkXSA9IEBkZWZlcnJhbHNbaWRdLnByb21pc2VcblxuICAgICAgdXJsID0gW0BnZXRVUkwoKSwgaW5jb21pbmcuam9pbiAnLCddLmpvaW4gJy8nXG4gICAgICBwcmludC5sb2cgJ1JlcXVlc3QgZm9yJywgQG5hbWUsICdhdCcsIHVybFxuICAgICAgQGFwaUNsaWVudC5nZXQodXJsLCBvcHRpb25zKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgIHByaW50LmxvZyAnR290JywgQG5hbWUsIHJlc291cmNlc1xuXG4gICAgaWYgZ2l2ZW5TdHJpbmdcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkc1swXV1cbiAgICBlbHNlXG4gICAgICBQcm9taXNlLmFsbCAoQHJlc291cmNlUHJvbWlzZXNbaWRdIGZvciBpZCBpbiBpZHMpXG5cbiAgZ2V0QnlRdWVyeTogKHF1ZXJ5LCBsaW1pdCA9IEluZmluaXR5KSAtPlxuICAgIEBxdWVyeUxvY2FsKHF1ZXJ5KS50aGVuIChleGlzdGluZykgPT5cbiAgICAgIGlmIGV4aXN0aW5nLmxlbmd0aCA+PSBsaW1pdFxuICAgICAgICBleGlzdGluZ1xuICAgICAgZWxzZVxuICAgICAgICBwYXJhbXMgPSBsaW1pdDogbGltaXQgLSBleGlzdGluZy5sZW5ndGhcbiAgICAgICAgQGFwaUNsaWVudC5nZXQoQGdldFVSTCgpLCBtZXJnZUludG8gcGFyYW1zLCBxdWVyeSkudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIFByb21pc2UuYWxsIGV4aXN0aW5nLmNvbmNhdCByZXNvdXJjZXNcblxuICBjcmVhdGVSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgaWYgQHdhaXRpbmdGb3IgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdSZXNvbHZpbmcgYW5kIHJlbW92aW5nIGRlZmVycmFsIGZvcicsIEBuYW1lLCBkYXRhLmlkXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdLnJlc29sdmUgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdID0gbnVsbFxuICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1RoZScsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkLCAnZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdDcmVhdGluZyBuZXcnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzXG5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXVxuXG4gIF9oYW5kbGVSZXNvdXJjZUVtaXNzaW9uOiAocmVzb3VyY2UsIHNpZ25hbCwgcGF5bG9hZCkgLT5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuIl19

