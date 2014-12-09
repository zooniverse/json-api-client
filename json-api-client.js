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
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, Resource, Type, makeHTTPRequest, mergeInto, print,
  __slice = [].slice;

print = _dereq_('./print');

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

Resource = _dereq_('./resource');

DEFAULT_TYPE_AND_ACCEPT = {
  'Content-Type': 'application/vnd.api+json',
  'Accept': "application/vnd.api+json"
};

module.exports = JSONAPIClient = (function() {
  var method, _fn, _i, _len, _ref;

  JSONAPIClient.prototype.root = '/';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype.types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
    this.types = {};
    print.info('Created a new JSON-API client at', this.root);
  }

  JSONAPIClient.prototype.request = function(method, url, data, additionalHeaders, callback) {
    var headers;
    print.info('Making a', method, 'request to', url);
    headers = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, additionalHeaders);
    return makeHTTPRequest(method, this.root + url, data, headers).then((function(_this) {
      return function(request) {
        return _this.processResponseTo(request, callback);
      };
    })(this))["catch"]((function(_this) {
      return function(request) {
        return _this.processErrorResponseTo(request);
      };
    })(this));
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

  JSONAPIClient.prototype.processResponseTo = function(request, callback) {
    var attribute, attributeType, href, link, primaryResults, resource, resources, response, type, typeAndAttribute, _j, _k, _len1, _len2, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
    response = (function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {}
    })();
    if (response == null) {
      response = {};
    }
    print.log('Processing response', response);
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
        this.createType(type);
        _ref4 = [].concat(resources);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          resource = _ref4[_j];
          this.types[type].addExistingResource(resource);
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
          this.createType(response.type);
          _results.push(this.types[response.type].addExistingResource(resource));
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
        this.createType(type);
        _ref7 = [].concat(resources);
        for (_k = 0, _len2 = _ref7.length; _k < _len2; _k++) {
          resource = _ref7[_k];
          primaryResults.push(this.types[type].addExistingResource(resource));
        }
      }
    }
    print.info('Primary resources:', primaryResults);
    if (typeof callback === "function") {
      callback(request, response);
    }
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype.handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var type, _base;
    type = this.createType(typeName);
    if ((_base = type.links)[attributeName] == null) {
      _base[attributeName] = {};
    }
    if (hrefTemplate != null) {
      type.links[attributeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return type.links[attributeName].type = attributeTypeName;
    }
  };

  JSONAPIClient.prototype.createType = function(name) {
    var _base;
    if ((_base = this.types)[name] == null) {
      _base[name] = new Type(name, this);
    }
    return this.types[name];
  };

  JSONAPIClient.prototype.processErrorResponseTo = function(request) {
    return Promise.reject((function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {
        return new Error(request.responseText || request.status);
      }
    })());
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};

module.exports.Type = Type;

module.exports.Resource = Resource;



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./resource":6,"./type":7}],3:[function(_dereq_,module,exports){
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
    if (data instanceof Blob) {
      return request.send(data);
    } else {
      return request.send(JSON.stringify(data));
    }
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
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype._type = null;

  Resource.prototype._readOnlyKeys = ['id', 'type', 'href', 'created_at', 'updated_at'];

  Resource.prototype._changedKeys = null;

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    this._changedKeys = [];
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    this.emit('create');
    this._type.emit('change');
    print.info("Constructed a resource: " + this._type.name + " " + this.id, this);
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
    var appliedHREF, context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type.links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type.name] = this;
        appliedHREF = this.applyHREF(href, context);
        return this._type.apiClient.get(appliedHREF).then((function(_this) {
          return function(resources) {
            var _ref1;
            if (typeof ((_ref1 = _this.links) != null ? _ref1[name] : void 0) === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
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
        appliedHREF = this.applyHREF(href, context);
        return this._type.apiClient.get(appliedHREF).then((function(_this) {
          return function(resources) {
            var _ref1;
            if (typeof ((_ref1 = _this.links) != null ? _ref1[name] : void 0) === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
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

  Resource.prototype.update = function(changeSet) {
    var actualChanges, key, value;
    if (changeSet == null) {
      changeSet = {};
    }
    this.emit('will-change');
    actualChanges = 0;
    for (key in changeSet) {
      value = changeSet[key];
      if (!(this[key] !== value)) {
        continue;
      }
      this[key] = value;
      if (__indexOf.call(this._changedKeys, key) < 0) {
        this._changedKeys.push(key);
      }
      actualChanges += 1;
    }
    if (actualChanges !== 0) {
      this.emit('change');
      return this._type.emit('change');
    }
  };

  Resource.prototype.save = function() {
    var payload, save;
    this.emit('will-save');
    payload = {};
    payload[this._type.name] = this.getChangesSinceSave();
    save = this.id ? this._type.apiClient.put(this.getURL(), payload) : this._type.apiClient.post(this._type.getURL(), payload);
    return save.then((function(_this) {
      return function(_arg) {
        var result;
        result = _arg[0];
        _this.update(result);
        _this._changedKeys.splice(0);
        _this.emit('save');
        return result;
      };
    })(this));
  };

  Resource.prototype.getChangesSinceSave = function() {
    var changes, key, _i, _len, _ref;
    changes = {};
    _ref = this._changedKeys;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      changes[key] = this[key];
    }
    return changes;
  };

  Resource.prototype["delete"] = function() {
    var deletion;
    this.emit('will-delete');
    deletion = this.id ? this._type.apiClient["delete"](this.getURL()).then((function(_this) {
      return function() {
        return _this._type.emit('change');
      };
    })(this)) : Promise.resolve();
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

  Resource.prototype.getURL = function() {
    return this.href || [this._type.getURL(), this.id].join('/');
  };

  Resource.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    result[this._type.name] = {};
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if (key.charAt(0) !== '_' && __indexOf.call(this._readOnlyKeys, key) < 0) {
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
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  function Type(name, apiClient) {
    this.name = name;
    this.apiClient = apiClient;
    Type.__super__.constructor.apply(this, arguments);
    this.links = {};
    this.deferrals = {};
    this.resourcePromises = {};
    print.info('Defined a new type:', this.name);
  }

  Type.prototype.getURL = function() {
    return '/' + this.name;
  };

  Type.prototype.queryLocal = function(query) {
    var existLocally, id, promise;
    existLocally = (function() {
      var _ref, _results;
      _ref = this.resourcePromises;
      _results = [];
      for (id in _ref) {
        promise = _ref[id];
        if (!this.waitingFor(id)) {
          _results.push(promise);
        }
      }
      return _results;
    }).call(this);
    return Promise.all(existLocally).then(function(resources) {
      var resource, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = resources.length; _i < _len; _i++) {
        resource = resources[_i];
        if (resource.matchesQuery(query)) {
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
    if (typeof arguments[0] === 'string') {
      return this.getByID.apply(this, arguments);
    } else if (Array.isArray(arguments[0])) {
      return this.getByIDs.apply(this, arguments);
    } else {
      return this.getByQuery.apply(this, arguments);
    }
  };

  Type.prototype.getByID = function() {
    var id, otherArgs;
    id = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this.getByIDs.apply(this, [[id]].concat(__slice.call(otherArgs))).then(function(_arg) {
      var resource;
      resource = _arg[0];
      return resource;
    });
  };

  Type.prototype.getByIDs = function(ids, options, callback) {
    var id, incoming, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    incoming = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (!this.has(id)) {
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
      this.apiClient.get(url, options, null, callback);
    }
    return Promise.all((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
        id = ids[_j];
        _results.push(this.resourcePromises[id]);
      }
      return _results;
    }).call(this));
  };

  Type.prototype.getByQuery = function(query, limit, callback) {
    if (limit == null) {
      limit = Infinity;
    }
    return this.queryLocal(query).then((function(_this) {
      return function(existing) {
        var existingIDs, id, params;
        if (existing.length >= limit) {
          return existing;
        } else {
          existingIDs = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = existing.length; _i < _len; _i++) {
              id = existing[_i].id;
              _results.push(id);
            }
            return _results;
          })();
          params = {};
          if (isFinite(limit)) {
            params.limit = limit - existing.length;
          }
          mergeInto(params, query);
          return _this.apiClient.get(_this.getURL(), params, null, callback).then(function(resources) {
            var fetched, resource;
            fetched = (function() {
              var _i, _len, _ref, _results;
              _results = [];
              for (_i = 0, _len = resources.length; _i < _len; _i++) {
                resource = resources[_i];
                if (_ref = resource.id, __indexOf.call(existingIDs, _ref) < 0) {
                  _results.push(resource);
                }
              }
              return _results;
            })();
            return Promise.all(existing.concat(fetched));
          });
        }
      };
    })(this));
  };

  Type.prototype.addExistingResource = function(data) {
    var deferral, newResource;
    if (this.waitingFor(data.id)) {
      print.log('Done waiting for', this.name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      deferral = this.deferrals[data.id];
      this.deferrals[data.id] = null;
      deferral.resolve(newResource);
    } else if (this.has(data.id)) {
      print.log('The', this.name, 'resource', data.id, 'already exists; will update');
      this.get(data.id).then(function(resource) {
        return resource.update(data);
      });
    } else {
      print.log('Accepting', this.name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      this.resourcePromises[data.id] = Promise.resolve(newResource);
    }
    return this.resourcePromises[data.id];
  };

  Type.prototype.createResource = function(data) {
    var resource;
    print.log('Creating a new', this.name, 'resource');
    resource = new Resource({
      _type: this
    });
    resource.update(data);
    return resource;
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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QUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxnQkFBVixFQUE0QixJQUFDLENBQUEsSUFBN0IsRUFBbUMsVUFBbkMsQ0FBQSxDQUFBO0FBQUEsSUFDQSxRQUFBLEdBQWUsSUFBQSxRQUFBLENBQVM7QUFBQSxNQUFBLEtBQUEsRUFBTyxJQUFQO0tBQVQsQ0FEZixDQUFBO0FBQUEsSUFFQSxRQUFRLENBQUMsTUFBVCxDQUFnQixJQUFoQixDQUZBLENBQUE7V0FHQSxTQUpjO0VBQUEsQ0E3RmhCLENBQUE7O2NBQUE7O0dBRGtDLFFBWnBDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcblxuICBzdG9wTGlzdGVuaW5nOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBpZiBzaWduYWw/XG4gICAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgICBpZiBBcnJheS5pc0FycmF5IGNhbGxiYWNrXG4gICAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgICBmb3IgaGFuZGxlciwgaSBpbiBAX2NhbGxiYWNrc1tzaWduYWxdIGJ5IC0xIHdoZW4gQXJyYXkuaXNBcnJheShoYW5kbGVyKSBhbmQgY2FsbGJhY2subGVuZ3RoIGlzIGhhbmRsZXIubGVuZ3RoXG4gICAgICAgICAgICAgIGlmIChudWxsIGZvciBpdGVtLCBqIGluIGNhbGxiYWNrIHdoZW4gaGFuZGxlcltqXSBpcyBpdGVtKS5sZW5ndGggaXMgY2FsbGJhY2subGVuZ3RoXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgICB1bmxlc3MgaW5kZXggaXMgLTFcbiAgICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSAwXG4gICAgZWxzZVxuICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsIGZvciBzaWduYWwgb2YgQF9jYWxsYmFja3NcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIHByaW50LmxvZyAnRW1pdHRpbmcnLCBzaWduYWwsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLCBAX2NhbGxiYWNrc1tzaWduYWxdPy5sZW5ndGhcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIEBfY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcblxuICBfY2FsbEhhbmRsZXI6IChoYW5kbGVyLCBhcmdzKSAtPlxuICAgIGlmIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgICBoYW5kbGVyID0gY29udGV4dFtoYW5kbGVyXVxuICAgIGVsc2VcbiAgICAgIGJvdW5kQXJncyA9IFtdXG4gICAgaGFuZGxlci5hcHBseSBjb250ZXh0LCBib3VuZEFyZ3MuY29uY2F0IGFyZ3NcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbm1ha2VIVFRQUmVxdWVzdCA9IHJlcXVpcmUgJy4vbWFrZS1odHRwLXJlcXVlc3QnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5UeXBlID0gcmVxdWlyZSAnLi90eXBlJ1xuUmVzb3VyY2UgPSByZXF1aXJlICcuL3Jlc291cmNlJ1xuXG5ERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCA9XG4gICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuICAnQWNjZXB0JzogXCJhcHBsaWNhdGlvbi92bmQuYXBpK2pzb25cIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEpTT05BUElDbGllbnRcbiAgcm9vdDogJy8nXG4gIGhlYWRlcnM6IG51bGxcblxuICB0eXBlczogbnVsbCAjIFR5cGVzIHRoYXQgaGF2ZSBiZWVuIGRlZmluZWRcblxuICBjb25zdHJ1Y3RvcjogKEByb290LCBAaGVhZGVycyA9IHt9KSAtPlxuICAgIEB0eXBlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnQ3JlYXRlZCBhIG5ldyBKU09OLUFQSSBjbGllbnQgYXQnLCBAcm9vdFxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgZGF0YSwgYWRkaXRpb25hbEhlYWRlcnMsIGNhbGxiYWNrKSAtPlxuICAgIHByaW50LmluZm8gJ01ha2luZyBhJywgbWV0aG9kLCAncmVxdWVzdCB0bycsIHVybFxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QgbWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVyc1xuICAgICAgLnRoZW4gKHJlcXVlc3QpID0+XG4gICAgICAgIEBwcm9jZXNzUmVzcG9uc2VUbyByZXF1ZXN0LCBjYWxsYmFja1xuICAgICAgLmNhdGNoIChyZXF1ZXN0KSA9PlxuICAgICAgICBAcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbyByZXF1ZXN0XG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLnRvVXBwZXJDYXNlKCksIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCwgY2FsbGJhY2spIC0+XG4gICAgcmVzcG9uc2UgPSB0cnkgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIHJlc3BvbnNlID89IHt9XG4gICAgcHJpbnQubG9nICdQcm9jZXNzaW5nIHJlc3BvbnNlJywgcmVzcG9uc2VcblxuICAgIGlmICdsaW5rcycgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlQW5kQXR0cmlidXRlLCBsaW5rIG9mIHJlc3BvbnNlLmxpbmtzXG4gICAgICAgIFt0eXBlLCBhdHRyaWJ1dGVdID0gdHlwZUFuZEF0dHJpYnV0ZS5zcGxpdCAnLidcbiAgICAgICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZydcbiAgICAgICAgICBocmVmID0gbGlua1xuICAgICAgICBlbHNlXG4gICAgICAgICAge2hyZWYsIHR5cGU6IGF0dHJpYnV0ZVR5cGV9ID0gbGlua1xuXG4gICAgICAgIEBoYW5kbGVMaW5rIHR5cGUsIGF0dHJpYnV0ZSwgaHJlZiwgYXR0cmlidXRlVHlwZVxuXG4gICAgaWYgJ2xpbmtlZCcgb2YgcmVzcG9uc2VcbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2UubGlua2VkXG4gICAgICAgIHByaW50LmxvZyAnR290JywgcmVzb3VyY2VzID8gMSwgJ2xpbmtlZCcsIHR5cGUsICdyZXNvdXJjZXMuJ1xuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgQHR5cGVzW3R5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIGlmICdkYXRhJyBvZiByZXNwb25zZVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIHJlc3BvbnNlLmRhdGEubGVuZ3RoID8gMVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgQGNyZWF0ZVR5cGUgcmVzcG9uc2UudHlwZVxuICAgICAgICBAdHlwZXNbcmVzcG9uc2UudHlwZV0uYWRkRXhpc3RpbmdSZXNvdXJjZSByZXNvdXJjZVxuICAgIGVsc2VcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gW11cbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlIG5vdCBpbiBbJ2xpbmtzJywgJ2xpbmtlZCcsICdtZXRhJywgJ2RhdGEnXVxuICAgICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCcsIHR5cGUsICdjb2xsZWN0aW9uIG9mJywgcmVzb3VyY2VzLmxlbmd0aCA/IDFcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZVxuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIHByaW1hcnlSZXN1bHRzLnB1c2ggQHR5cGVzW3R5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIHByaW50LmluZm8gJ1ByaW1hcnkgcmVzb3VyY2VzOicsIHByaW1hcnlSZXN1bHRzXG4gICAgY2FsbGJhY2s/IHJlcXVlc3QsIHJlc3BvbnNlXG4gICAgUHJvbWlzZS5hbGwgcHJpbWFyeVJlc3VsdHNcblxuICBoYW5kbGVMaW5rOiAodHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWZUZW1wbGF0ZSwgYXR0cmlidXRlVHlwZU5hbWUpIC0+XG4gICAgdHlwZSA9IEBjcmVhdGVUeXBlIHR5cGVOYW1lXG5cbiAgICB0eXBlLmxpbmtzW2F0dHJpYnV0ZU5hbWVdID89IHt9XG4gICAgaWYgaHJlZlRlbXBsYXRlP1xuICAgICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICB0eXBlLmxpbmtzW2F0dHJpYnV0ZU5hbWVdLnR5cGUgPSBhdHRyaWJ1dGVUeXBlTmFtZVxuXG4gIGNyZWF0ZVR5cGU6IChuYW1lKSAtPlxuICAgIEB0eXBlc1tuYW1lXSA/PSBuZXcgVHlwZSBuYW1lLCB0aGlzXG4gICAgQHR5cGVzW25hbWVdXG5cbiAgcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgUHJvbWlzZS5yZWplY3QgdHJ5XG4gICAgICBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgY2F0Y2hcbiAgICAgIG5ldyBFcnJvciByZXF1ZXN0LnJlc3BvbnNlVGV4dCB8fCByZXF1ZXN0LnN0YXR1c1xuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbm1vZHVsZS5leHBvcnRzLlR5cGUgPSBUeXBlXG5tb2R1bGUuZXhwb3J0cy5SZXNvdXJjZSA9IFJlc291cmNlXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5cbiMgTWFrZSBhIHJhdywgbm9uLUFQSSBzcGVjaWZpYyBIVFRQIHJlcXVlc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBtb2RpZnkpIC0+XG4gIHByaW50LmluZm8gJ1JlcXVlc3RpbmcnLCBtZXRob2QsIHVybCwgZGF0YVxuICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcbiAgICByZXF1ZXN0Lm9wZW4gbWV0aG9kLCBlbmNvZGVVUkkgdXJsXG5cbiAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWVcblxuICAgIGlmIGhlYWRlcnM/XG4gICAgICBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBoZWFkZXJzXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlciBoZWFkZXIsIHZhbHVlXG5cbiAgICBpZiBtb2RpZnk/XG4gICAgICBtb2RpZmljYXRpb25zID0gbW9kaWZ5IHJlcXVlc3RcblxuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKGUpIC0+XG4gICAgICBwcmludC5sb2cgJ1JlYWR5IHN0YXRlOicsIChrZXkgZm9yIGtleSwgdmFsdWUgb2YgcmVxdWVzdCB3aGVuIHZhbHVlIGlzIHJlcXVlc3QucmVhZHlTdGF0ZSBhbmQga2V5IGlzbnQgJ3JlYWR5U3RhdGUnKVswXVxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBwcmludC5sb2cgJ0RvbmU7IHN0YXR1cyBpcycsIHJlcXVlc3Quc3RhdHVzXG4gICAgICAgIGlmIDIwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDMwMFxuICAgICAgICAgIHJlc29sdmUgcmVxdWVzdFxuICAgICAgICBlbHNlICMgaWYgNDAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgNjAwXG4gICAgICAgICAgcmVqZWN0IHJlcXVlc3RcblxuICAgIGlmIGRhdGEgaW5zdGFuY2VvZiBCbG9iXG4gICAgICByZXF1ZXN0LnNlbmQgZGF0YVxuICAgIGVsc2VcbiAgICAgIHJlcXVlc3Quc2VuZCBKU09OLnN0cmluZ2lmeSBkYXRhXG4iLCIjIFRoaXMgaXMgYSBwcmV0dHkgc3RhbmRhcmQgbWVyZ2UgZnVuY3Rpb24uXG4jIE1lcmdlIHByb3BlcnRpZXMgb2YgYWxsIGFyZ3VlbWVudHMgaW50byB0aGUgZmlyc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwiTE9HX0xFVkVMID0gcGFyc2VGbG9hdCBsb2NhdGlvbi5zZWFyY2gubWF0Y2goL2pzb24tYXBpLWxvZz0oXFxkKykvKT9bMV0gPyAwXG5cbnByaW50ID0gKGxldmVsLCBjb2xvciwgbWVzc2FnZXMuLi4pIC0+XG4gIGlmIExPR19MRVZFTCA+PSBsZXZlbFxuICAgIGNvbnNvbGUubG9nICclY3tqc29uOmFwaX0nLCBcImNvbG9yOiAje2NvbG9yfTsgZm9udDogYm9sZCAxZW0gbW9ub3NwYWNlO1wiLCBtZXNzYWdlcy4uLlxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIGxvZzogcHJpbnQuYmluZCBudWxsLCA0LCAnZ3JheSdcbiAgaW5mbzogcHJpbnQuYmluZCBudWxsLCAzLCAnYmx1ZSdcbiAgd2FybjogcHJpbnQuYmluZCBudWxsLCAyLCAnb3JhbmdlJ1xuICBlcnJvcjogcHJpbnQuYmluZCBudWxsLCAxLCAncmVkJ1xuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBSZXNvdXJjZSBleHRlbmRzIEVtaXR0ZXJcbiAgX3R5cGU6IG51bGwgIyBUaGUgcmVzb3VyY2UgdHlwZSBvYmplY3RcblxuICBfcmVhZE9ubHlLZXlzOiBbJ2lkJywgJ3R5cGUnLCAnaHJlZicsICdjcmVhdGVkX2F0JywgJ3VwZGF0ZWRfYXQnXVxuXG4gIF9jaGFuZ2VkS2V5czogbnVsbCAjIERpcnR5IGtleXNcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZy4uLikgLT5cbiAgICBzdXBlclxuICAgIEBfY2hhbmdlZEtleXMgPSBbXVxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWcuLi4gaWYgY29uZmlnP1xuICAgIEBlbWl0ICdjcmVhdGUnXG4gICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcbiAgICBwcmludC5pbmZvIFwiQ29uc3RydWN0ZWQgYSByZXNvdXJjZTogI3tAX3R5cGUubmFtZX0gI3tAaWR9XCIsIHRoaXNcblxuICAjIEdldCBhIHByb21pc2UgZm9yIGFuIGF0dHJpYnV0ZSByZWZlcnJpbmcgdG8gKGFuKW90aGVyIHJlc291cmNlKHMpLlxuICBhdHRyOiAoYXR0cmlidXRlKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcgbGluazonLCBhdHRyaWJ1dGVcbiAgICBpZiBhdHRyaWJ1dGUgb2YgdGhpc1xuICAgICAgcHJpbnQud2FybiBcIk5vIG5lZWQgdG8gYWNjZXNzIGEgbm9uLWxpbmtlZCBhdHRyaWJ1dGUgdmlhIGF0dHI6ICN7YXR0cmlidXRlfVwiLCB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUgQFthdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBAbGlua3M/IGFuZCBhdHRyaWJ1dGUgb2YgQGxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgcmVzb3VyY2UnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgYXR0cmlidXRlIG9mIEBfdHlwZS5saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUubGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUubmFtZX0gcmVzb3VyY2VcIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLmxpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgYXBwbGllZEhSRUYgPSBAYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQoYXBwbGllZEhSRUYpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBpZiB0eXBlb2YgQGxpbmtzP1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlIGlmIGxpbms/XG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBjb2xsZWN0aW9uIG9iamVjdCcsIGxpbmtcbiAgICAgICMgSXQncyBhIGNvbGxlY3Rpb24gb2JqZWN0LlxuICAgICAge2hyZWYsIGlkcywgdHlwZX0gPSBsaW5rXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgcHJpbnQud2FybiAnSFJFRicsIGhyZWZcbiAgICAgICAgYXBwbGllZEhSRUYgPSBAYXBwbHlIUkVGIGhyZWYsIGNvbnRleHRcbiAgICAgICAgQF90eXBlLmFwaUNsaWVudC5nZXQoYXBwbGllZEhSRUYpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBpZiB0eXBlb2YgQGxpbmtzP1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5hcGlDbGllbnQudHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCwgYnV0IGJsYW5rJ1xuICAgICAgIyBJdCBleGlzdHMsIGJ1dCBpdCdzIGJsYW5rLlxuICAgICAgUHJvbWlzZS5yZXNvbHZlIG51bGxcblxuICAjIFR1cm4gYSBKU09OLUFQSSBcImhyZWZcIiB0ZW1wbGF0ZSBpbnRvIGEgdXNhYmxlIFVSTC5cbiAgUExBQ0VIT0xERVJTX1BBVFRFUk46IC97KC4rPyl9L2dcbiAgYXBwbHlIUkVGOiAoaHJlZiwgY29udGV4dCkgLT5cbiAgICBocmVmLnJlcGxhY2UgQFBMQUNFSE9MREVSU19QQVRURVJOLCAoXywgcGF0aCkgLT5cbiAgICAgIHNlZ21lbnRzID0gcGF0aC5zcGxpdCAnLidcbiAgICAgIHByaW50Lndhcm4gJ1NlZ21lbnRzJywgc2VnbWVudHNcblxuICAgICAgdmFsdWUgPSBjb250ZXh0XG4gICAgICB1bnRpbCBzZWdtZW50cy5sZW5ndGggaXMgMFxuICAgICAgICBzZWdtZW50ID0gc2VnbWVudHMuc2hpZnQoKVxuICAgICAgICB2YWx1ZSA9IHZhbHVlW3NlZ21lbnRdID8gdmFsdWUubGlua3M/W3NlZ21lbnRdXG5cbiAgICAgIHByaW50Lndhcm4gJ1ZhbHVlJywgdmFsdWVcblxuICAgICAgaWYgQXJyYXkuaXNBcnJheSB2YWx1ZVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLmpvaW4gJywnXG5cbiAgICAgIHVubGVzcyB0eXBlb2YgdmFsdWUgaXMgJ3N0cmluZydcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVmFsdWUgZm9yICcje3BhdGh9JyBpbiAnI3tocmVmfScgc2hvdWxkIGJlIGEgc3RyaW5nLlwiXG5cbiAgICAgIHZhbHVlXG5cbiAgdXBkYXRlOiAoY2hhbmdlU2V0ID0ge30pIC0+XG4gICAgQGVtaXQgJ3dpbGwtY2hhbmdlJ1xuICAgIGFjdHVhbENoYW5nZXMgPSAwXG5cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgQFtrZXldID0gdmFsdWVcbiAgICAgIHVubGVzcyBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgICBAX2NoYW5nZWRLZXlzLnB1c2gga2V5XG4gICAgICBhY3R1YWxDaGFuZ2VzICs9IDFcblxuICAgIHVubGVzcyBhY3R1YWxDaGFuZ2VzIGlzIDBcbiAgICAgIEBlbWl0ICdjaGFuZ2UnXG4gICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcblxuICAgIHBheWxvYWQgPSB7fVxuICAgIHBheWxvYWRbQF90eXBlLm5hbWVdID0gQGdldENoYW5nZXNTaW5jZVNhdmUoKVxuXG4gICAgc2F2ZSA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wdXQgQGdldFVSTCgpLCBwYXlsb2FkXG4gICAgZWxzZVxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wb3N0IEBfdHlwZS5nZXRVUkwoKSwgcGF5bG9hZFxuXG4gICAgc2F2ZS50aGVuIChbcmVzdWx0XSkgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0XG4gICAgICBAX2NoYW5nZWRLZXlzLnNwbGljZSAwXG4gICAgICBAZW1pdCAnc2F2ZSdcbiAgICAgIHJlc3VsdFxuXG4gIGdldENoYW5nZXNTaW5jZVNhdmU6IC0+XG4gICAgY2hhbmdlcyA9IHt9XG4gICAgZm9yIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICBjaGFuZ2VzW2tleV0gPSBAW2tleV1cbiAgICBjaGFuZ2VzXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5kZWxldGUoQGdldFVSTCgpKS50aGVuID0+XG4gICAgICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbWF0Y2hlc1F1ZXJ5OiAocXVlcnkpIC0+XG4gICAgbWF0Y2hlcyA9IHRydWVcbiAgICBmb3IgcGFyYW0sIHZhbHVlIG9mIHF1ZXJ5XG4gICAgICBpZiBAW3BhcmFtXSBpc250IHZhbHVlXG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgIG1hdGNoZXNcblxuICBnZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgW0BfdHlwZS5nZXRVUkwoKSwgQGlkXS5qb2luICcvJ1xuXG4gIHRvSlNPTjogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtAX3R5cGUubmFtZV0gPSB7fVxuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5LmNoYXJBdCgwKSBpc250ICdfJyBhbmQga2V5IG5vdCBpbiBAX3JlYWRPbmx5S2V5c1xuICAgICAgcmVzdWx0W0BfdHlwZS5uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIG5hbWU6ICcnXG4gIGFwaUNsaWVudDogbnVsbFxuXG4gIGxpbmtzOiBudWxsICMgUmVzb3VyY2UgbGluayBkZWZpbml0aW9uc1xuXG4gIGRlZmVycmFsczogbnVsbCAjIEtleXMgYXJlIElEcyBvZiBzcGVjaWZpY2FsbHkgcmVxdWVzdGVkIHJlc291cmNlcy5cbiAgcmVzb3VyY2VQcm9taXNlczogbnVsbCAjIEtleXMgYXJlIElEcywgdmFsdWVzIGFyZSBwcm9taXNlcyByZXNvbHZpbmcgdG8gcmVzb3VyY2VzLlxuXG4gIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBhcGlDbGllbnQpIC0+XG4gICAgc3VwZXJcbiAgICBAbGlua3MgPSB7fVxuICAgIEBkZWZlcnJhbHMgPSB7fVxuICAgIEByZXNvdXJjZVByb21pc2VzID0ge31cbiAgICBwcmludC5pbmZvICdEZWZpbmVkIGEgbmV3IHR5cGU6JywgQG5hbWVcblxuICBnZXRVUkw6IC0+XG4gICAgJy8nICsgQG5hbWVcblxuICBxdWVyeUxvY2FsOiAocXVlcnkpIC0+XG4gICAgZXhpc3RMb2NhbGx5ID0gKHByb21pc2UgZm9yIGlkLCBwcm9taXNlIG9mIEByZXNvdXJjZVByb21pc2VzIHdoZW4gbm90IEB3YWl0aW5nRm9yIGlkKVxuICAgIFByb21pc2UuYWxsKGV4aXN0TG9jYWxseSkudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlLm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAZGVmZXJyYWxzW2lkXT9cblxuICBoYXM6IChpZCkgLT5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0/IGFuZCBub3QgQGRlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZydcbiAgICAgIEBnZXRCeUlEIGFyZ3VtZW50cy4uLlxuICAgIGVsc2UgaWYgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICBnZXRCeUlEOiAoaWQsIG90aGVyQXJncy4uLikgLT5cbiAgICBAZ2V0QnlJRHMoW2lkXSwgb3RoZXJBcmdzLi4uKS50aGVuIChbcmVzb3VyY2VdKSAtPlxuICAgICAgcmVzb3VyY2VcblxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBuYW1lLCAnYnkgSUQocyknLCBpZHNcbiAgICAjIE9ubHkgcmVxdWVzdCB0aGluZ3Mgd2UgZG9uJ3QgYWxyZWFkeSBoYXZlLlxuICAgIGluY29taW5nID0gKGlkIGZvciBpZCBpbiBpZHMgd2hlbiBub3QgQGhhcyBpZClcbiAgICBwcmludC5sb2cgJ0luY29taW5nOiAnLCBpbmNvbWluZ1xuXG4gICAgdW5sZXNzIGluY29taW5nLmxlbmd0aCBpcyAwXG4gICAgICBmb3IgaWQgaW4gaW5jb21pbmdcbiAgICAgICAgQGRlZmVycmFsc1tpZF0gPSBkZWZlcigpXG4gICAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkXSA9IEBkZWZlcnJhbHNbaWRdLnByb21pc2VcblxuICAgICAgdXJsID0gW0BnZXRVUkwoKSwgaW5jb21pbmcuam9pbiAnLCddLmpvaW4gJy8nXG4gICAgICBwcmludC5sb2cgJ1JlcXVlc3QgZm9yJywgQG5hbWUsICdhdCcsIHVybFxuICAgICAgQGFwaUNsaWVudC5nZXQgdXJsLCBvcHRpb25zLCBudWxsLCBjYWxsYmFja1xuXG4gICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSwgY2FsbGJhY2spIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIGV4aXN0aW5nSURzID0gKGlkIGZvciB7aWR9IGluIGV4aXN0aW5nKVxuICAgICAgICBwYXJhbXMgPSB7fVxuICAgICAgICBpZiBpc0Zpbml0ZSBsaW1pdFxuICAgICAgICAgIHBhcmFtcy5saW1pdCA9IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5XG5cbiAgICAgICAgQGFwaUNsaWVudC5nZXQoQGdldFVSTCgpLCBwYXJhbXMsIG51bGwsIGNhbGxiYWNrKS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICAgICAgZmV0Y2hlZCA9IChyZXNvdXJjZSBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzIHdoZW4gcmVzb3VyY2UuaWQgbm90IGluIGV4aXN0aW5nSURzKVxuICAgICAgICAgIFByb21pc2UuYWxsIGV4aXN0aW5nLmNvbmNhdCBmZXRjaGVkXG5cbiAgYWRkRXhpc3RpbmdSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgaWYgQHdhaXRpbmdGb3IgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdEb25lIHdhaXRpbmcgZm9yJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBkZWZlcnJhbCA9IEBkZWZlcnJhbHNbZGF0YS5pZF1cbiAgICAgIEBkZWZlcnJhbHNbZGF0YS5pZF0gPSBudWxsXG4gICAgICBkZWZlcnJhbC5yZXNvbHZlIG5ld1Jlc291cmNlXG5cbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2FscmVhZHkgZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0FjY2VwdGluZycsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpcywgZGF0YVxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgYSBuZXcnLCBAbmFtZSwgJ3Jlc291cmNlJ1xuICAgIHJlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzXG4gICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcbiAgICByZXNvdXJjZVxuIl19

