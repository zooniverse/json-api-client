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
    var header, key, modifications, request, value;
    if ((data != null) && method === 'GET') {
      url += '?' + ((function() {
        var _results;
        _results = [];
        for (key in data) {
          value = data[key];
          _results.push([key, value].join('='));
        }
        return _results;
      })()).join('&');
      data = null;
    }
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
      var _ref;
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
var print,
  __slice = [].slice;

print = function() {
  var color, level, messages, prefix, setting, _ref, _ref1;
  level = arguments[0], color = arguments[1], messages = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
  setting = typeof JSON_API_LOG_LEVEL !== "undefined" && JSON_API_LOG_LEVEL !== null ? JSON_API_LOG_LEVEL : parseFloat((_ref = typeof location !== "undefined" && location !== null ? (_ref1 = location.search.match(/json-api-log=(\d+)/)) != null ? _ref1[1] : void 0 : void 0) != null ? _ref : 0);
  if (setting >= level) {
    prefix = typeof location !== "undefined" && location !== null ? ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"] : ['{json:api}'];
    return typeof console !== "undefined" && console !== null ? console.log.apply(console, __slice.call(prefix).concat(__slice.call(messages))) : void 0;
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

  Resource.prototype.refresh = function() {
    if (this.id) {
      return this._type.get(this.id);
    } else {
      return Promise.reject(new Error('Can\'t refresh a resource with no ID'));
    }
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
    var id, url, _i, _len;
    print.info('Getting', this.name, 'by ID(s)', ids);
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      this.deferrals[id] = defer();
      this.resourcePromises[id] = this.deferrals[id].promise;
    }
    url = [this.getURL(), ids.join(',')].join('/');
    print.log('Request for', this.name, 'at', url);
    this.apiClient.get(url, options, null, callback);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxjQUFBO0VBQUEsa0JBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxDQUFB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QSxDQUFBO0FBQUEsTUFDQSxXQUFBLEdBQWtCLElBQUEsUUFBQSxDQUFTO0FBQUEsUUFBQSxLQUFBLEVBQU8sSUFBUDtPQUFULEVBQXNCLElBQXRCLENBRGxCLENBQUE7QUFBQSxNQUVBLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFJLENBQUMsRUFBTCxDQUFsQixHQUE2QixPQUFPLENBQUMsT0FBUixDQUFnQixXQUFoQixDQUY3QixDQU5HO0tBUEw7V0FpQkEsSUFBQyxDQUFBLGdCQUFpQixDQUFBLElBQUksQ0FBQyxFQUFMLEVBbEJDO0VBQUEsQ0FwRXJCLENBQUE7O0FBQUEsaUJBd0ZBLGNBQUEsR0FBZ0IsU0FBQyxJQUFELEdBQUE7QUFDZCxRQUFBLFFBQUE7QUFBQSxJQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsZ0JBQVYsRUFBNEIsSUFBQyxDQUFBLElBQTdCLEVBQW1DLFVBQW5DLENBQUEsQ0FBQTtBQUFBLElBQ0EsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUFTO0FBQUEsTUFBQSxLQUFBLEVBQU8sSUFBUDtLQUFULENBRGYsQ0FBQTtBQUFBLElBRUEsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsSUFBaEIsQ0FGQSxDQUFBO1dBR0EsU0FKYztFQUFBLENBeEZoQixDQUFBOztjQUFBOztHQURrQyxRQVpwQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG5cbiAgc3RvcExpc3RlbmluZzogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgaWYgc2lnbmFsP1xuICAgICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkoaGFuZGxlcikgYW5kIGNhbGxiYWNrLmxlbmd0aCBpcyBoYW5kbGVyLmxlbmd0aFxuICAgICAgICAgICAgICBpZiAobnVsbCBmb3IgaXRlbSwgaiBpbiBjYWxsYmFjayB3aGVuIGhhbmRsZXJbal0gaXMgaXRlbSkubGVuZ3RoIGlzIGNhbGxiYWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIGVsc2VcbiAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBwcmludC5sb2cgJ0VtaXR0aW5nJywgc2lnbmFsLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSwgQF9jYWxsYmFja3Nbc2lnbmFsXT8ubGVuZ3RoXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAX2NhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG5cbiAgX2NhbGxIYW5kbGVyOiAoaGFuZGxlciwgYXJncykgLT5cbiAgICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgICBlbHNlXG4gICAgICBib3VuZEFyZ3MgPSBbXVxuICAgIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBhcmdzXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcvJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgdHlwZXM6IG51bGwgIyBUeXBlcyB0aGF0IGhhdmUgYmVlbiBkZWZpbmVkXG5cbiAgY29uc3RydWN0b3I6IChAcm9vdCwgQGhlYWRlcnMgPSB7fSkgLT5cbiAgICBAdHlwZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0NyZWF0ZWQgYSBuZXcgSlNPTi1BUEkgY2xpZW50IGF0JywgQHJvb3RcblxuICByZXF1ZXN0OiAobWV0aG9kLCB1cmwsIGRhdGEsIGFkZGl0aW9uYWxIZWFkZXJzLCBjYWxsYmFjaykgLT5cbiAgICBwcmludC5pbmZvICdNYWtpbmcgYScsIG1ldGhvZCwgJ3JlcXVlc3QgdG8nLCB1cmxcbiAgICBoZWFkZXJzID0gbWVyZ2VJbnRvIHt9LCBERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCwgQGhlYWRlcnMsIGFkZGl0aW9uYWxIZWFkZXJzXG4gICAgbWFrZUhUVFBSZXF1ZXN0IG1ldGhvZCwgQHJvb3QgKyB1cmwsIGRhdGEsIGhlYWRlcnNcbiAgICAgIC50aGVuIChyZXF1ZXN0KSA9PlxuICAgICAgICBAcHJvY2Vzc1Jlc3BvbnNlVG8gcmVxdWVzdCwgY2FsbGJhY2tcbiAgICAgIC5jYXRjaCAocmVxdWVzdCkgPT5cbiAgICAgICAgQHByb2Nlc3NFcnJvclJlc3BvbnNlVG8gcmVxdWVzdFxuXG4gIGZvciBtZXRob2QgaW4gWydnZXQnLCAncG9zdCcsICdwdXQnLCAnZGVsZXRlJ10gdGhlbiBkbyAobWV0aG9kKSA9PlxuICAgIEA6OlttZXRob2RdID0gLT5cbiAgICAgIEByZXF1ZXN0IG1ldGhvZC50b1VwcGVyQ2FzZSgpLCBhcmd1bWVudHMuLi5cblxuICBwcm9jZXNzUmVzcG9uc2VUbzogKHJlcXVlc3QsIGNhbGxiYWNrKSAtPlxuICAgIHJlc3BvbnNlID0gdHJ5IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICByZXNwb25zZSA/PSB7fVxuICAgIHByaW50LmxvZyAnUHJvY2Vzc2luZyByZXNwb25zZScsIHJlc3BvbnNlXG5cbiAgICBpZiAnbGlua3MnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiByZXNwb25zZS5saW5rc1xuICAgICAgICBbdHlwZSwgYXR0cmlidXRlXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnXG4gICAgICAgICAgaHJlZiA9IGxpbmtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHtocmVmLCB0eXBlOiBhdHRyaWJ1dGVUeXBlfSA9IGxpbmtcblxuICAgICAgICBAaGFuZGxlTGluayB0eXBlLCBhdHRyaWJ1dGUsIGhyZWYsIGF0dHJpYnV0ZVR5cGVcblxuICAgIGlmICdsaW5rZWQnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlLmxpbmtlZFxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIHJlc291cmNlcyA/IDEsICdsaW5rZWQnLCB0eXBlLCAncmVzb3VyY2VzLidcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZVxuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIEB0eXBlc1t0eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsIFwiZGF0YVwiIGNvbGxlY3Rpb24gb2YnLCByZXNwb25zZS5kYXRhLmxlbmd0aCA/IDFcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNwb25zZS5kYXRhXG4gICAgICAgIEBjcmVhdGVUeXBlIHJlc3BvbnNlLnR5cGVcbiAgICAgICAgQHR5cGVzW3Jlc3BvbnNlLnR5cGVdLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlIHdoZW4gdHlwZSBub3QgaW4gWydsaW5rcycsICdsaW5rZWQnLCAnbWV0YScsICdkYXRhJ11cbiAgICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwnLCB0eXBlLCAnY29sbGVjdGlvbiBvZicsIHJlc291cmNlcy5sZW5ndGggPyAxXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGVcbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBwcmltYXJ5UmVzdWx0cy5wdXNoIEB0eXBlc1t0eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBwcmludC5pbmZvICdQcmltYXJ5IHJlc291cmNlczonLCBwcmltYXJ5UmVzdWx0c1xuICAgIGNhbGxiYWNrPyByZXF1ZXN0LCByZXNwb25zZVxuICAgIFByb21pc2UuYWxsIHByaW1hcnlSZXN1bHRzXG5cbiAgaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHR5cGUgPSBAY3JlYXRlVHlwZSB0eXBlTmFtZVxuXG4gICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXSA/PSB7fVxuICAgIGlmIGhyZWZUZW1wbGF0ZT9cbiAgICAgIHR5cGUubGlua3NbYXR0cmlidXRlTmFtZV0uaHJlZiA9IGhyZWZUZW1wbGF0ZVxuICAgIGlmIGF0dHJpYnV0ZVR5cGVOYW1lP1xuICAgICAgdHlwZS5saW5rc1thdHRyaWJ1dGVOYW1lXS50eXBlID0gYXR0cmlidXRlVHlwZU5hbWVcblxuICBjcmVhdGVUeXBlOiAobmFtZSkgLT5cbiAgICBAdHlwZXNbbmFtZV0gPz0gbmV3IFR5cGUgbmFtZSwgdGhpc1xuICAgIEB0eXBlc1tuYW1lXVxuXG4gIHByb2Nlc3NFcnJvclJlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIFByb21pc2UucmVqZWN0IHRyeVxuICAgICAgSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIGNhdGNoXG4gICAgICBuZXcgRXJyb3IgcmVxdWVzdC5yZXNwb25zZVRleHQgfHwgcmVxdWVzdC5zdGF0dXNcblxubW9kdWxlLmV4cG9ydHMudXRpbCA9IHttYWtlSFRUUFJlcXVlc3R9XG5tb2R1bGUuZXhwb3J0cy5UeXBlID0gVHlwZVxubW9kdWxlLmV4cG9ydHMuUmVzb3VyY2UgPSBSZXNvdXJjZVxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuXG4jIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBwcmludC5pbmZvICdSZXF1ZXN0aW5nJywgbWV0aG9kLCB1cmwsIGRhdGFcbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBpZiBkYXRhPyBhbmQgbWV0aG9kIGlzICdHRVQnXG4gICAgICB1cmwgKz0gJz8nICsgKFtrZXksIHZhbHVlXS5qb2luICc9JyBmb3Iga2V5LCB2YWx1ZSBvZiBkYXRhKS5qb2luICcmJ1xuICAgICAgZGF0YSA9IG51bGxcblxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcbiAgICByZXF1ZXN0Lm9wZW4gbWV0aG9kLCBlbmNvZGVVUkkgdXJsXG5cbiAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWVcblxuICAgIGlmIGhlYWRlcnM/XG4gICAgICBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBoZWFkZXJzXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlciBoZWFkZXIsIHZhbHVlXG5cbiAgICBpZiBtb2RpZnk/XG4gICAgICBtb2RpZmljYXRpb25zID0gbW9kaWZ5IHJlcXVlc3RcblxuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKGUpIC0+XG4gICAgICBwcmludC5sb2cgJ1JlYWR5IHN0YXRlOicsIChrZXkgZm9yIGtleSwgdmFsdWUgb2YgcmVxdWVzdCB3aGVuIHZhbHVlIGlzIHJlcXVlc3QucmVhZHlTdGF0ZSBhbmQga2V5IGlzbnQgJ3JlYWR5U3RhdGUnKVswXVxuICAgICAgaWYgcmVxdWVzdC5yZWFkeVN0YXRlIGlzIHJlcXVlc3QuRE9ORVxuICAgICAgICBwcmludC5sb2cgJ0RvbmU7IHN0YXR1cyBpcycsIHJlcXVlc3Quc3RhdHVzXG4gICAgICAgIGlmIDIwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDMwMFxuICAgICAgICAgIHJlc29sdmUgcmVxdWVzdFxuICAgICAgICBlbHNlICMgaWYgNDAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgNjAwXG4gICAgICAgICAgcmVqZWN0IHJlcXVlc3RcblxuICAgIGlmIGRhdGEgaW5zdGFuY2VvZiBCbG9iXG4gICAgICByZXF1ZXN0LnNlbmQgZGF0YVxuICAgIGVsc2VcbiAgICAgIHJlcXVlc3Quc2VuZCBKU09OLnN0cmluZ2lmeSBkYXRhXG4iLCIjIFRoaXMgaXMgYSBwcmV0dHkgc3RhbmRhcmQgbWVyZ2UgZnVuY3Rpb24uXG4jIE1lcmdlIHByb3BlcnRpZXMgb2YgYWxsIGFyZ3VlbWVudHMgaW50byB0aGUgZmlyc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBrZXksIHZhbHVlIG9mIGFyZ3VtZW50XG4gICAgICBhcmd1bWVudHNbMF1ba2V5XSA9IHZhbHVlXG4gIGFyZ3VtZW50c1swXVxuIiwicHJpbnQgPSAobGV2ZWwsIGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgIyBTZXQgdGhlIGxvZyBsZXZlbCB3aXRoIGEgZ2xvYmFsIHZhcmlhYmxlIG9yIGEgcXVlcnkgcGFyYW0gaW4gdGhlIHBhZ2UncyBVUkwuXG4gIHNldHRpbmcgPSBKU09OX0FQSV9MT0dfTEVWRUwgPyBwYXJzZUZsb2F0IGxvY2F0aW9uPy5zZWFyY2gubWF0Y2goL2pzb24tYXBpLWxvZz0oXFxkKykvKT9bMV0gPyAwXG5cbiAgaWYgc2V0dGluZyA+PSBsZXZlbFxuICAgICMgV2UgY2FuIHN0eWxlIHRleHQgaW4gdGhlIGJyb3dzZXIgY29uc29sZSwgYnV0IG5vdCBhcyBlYXNpbHkgaW4gTm9kZS5cbiAgICBwcmVmaXggPSBpZiBsb2NhdGlvbj9cbiAgICAgIFsnJWN7anNvbjphcGl9JywgXCJjb2xvcjogI3tjb2xvcn07IGZvbnQ6IGJvbGQgMWVtIG1vbm9zcGFjZTtcIl1cbiAgICBlbHNlXG4gICAgICBbJ3tqc29uOmFwaX0nXVxuXG4gICAgY29uc29sZT8ubG9nIHByZWZpeC4uLiwgbWVzc2FnZXMuLi5cblxubW9kdWxlLmV4cG9ydHMgPVxuICBsb2c6IHByaW50LmJpbmQgbnVsbCwgNCwgJ2dyYXknXG4gIGluZm86IHByaW50LmJpbmQgbnVsbCwgMywgJ2JsdWUnXG4gIHdhcm46IHByaW50LmJpbmQgbnVsbCwgMiwgJ29yYW5nZSdcbiAgZXJyb3I6IHByaW50LmJpbmQgbnVsbCwgMSwgJ3JlZCdcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBFbWl0dGVyXG4gIF90eXBlOiBudWxsICMgVGhlIHJlc291cmNlIHR5cGUgb2JqZWN0XG5cbiAgX3JlYWRPbmx5S2V5czogWydpZCcsICd0eXBlJywgJ2hyZWYnLCAnY3JlYXRlZF9hdCcsICd1cGRhdGVkX2F0J11cblxuICBfY2hhbmdlZEtleXM6IG51bGwgIyBEaXJ0eSBrZXlzXG5cbiAgY29uc3RydWN0b3I6IChjb25maWcuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBAX2NoYW5nZWRLZXlzID0gW11cbiAgICBtZXJnZUludG8gdGhpcywgY29uZmlnLi4uIGlmIGNvbmZpZz9cbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgcHJpbnQuaW5mbyBcIkNvbnN0cnVjdGVkIGEgcmVzb3VyY2U6ICN7QF90eXBlLm5hbWV9ICN7QGlkfVwiLCB0aGlzXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgYXR0cjogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIHByaW50Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUubGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiB0eXBlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQF90eXBlLmxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlXG4gICAgICBwcmludC5lcnJvciAnTm90IGEgbGluayBhdCBhbGwnXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgXCJObyBhdHRyaWJ1dGUgI3thdHRyaWJ1dGV9IG9mICN7QF90eXBlLm5hbWV9IHJlc291cmNlXCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICBwcmludC5sb2cgJ0xpbmtlZCBieSBJRChzKSdcbiAgICAgIGlkcyA9IGxpbmtcbiAgICAgIHtocmVmLCB0eXBlfSA9IEBfdHlwZS5saW5rc1tuYW1lXVxuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZSBpZiBsaW5rP1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgY29sbGVjdGlvbiBvYmplY3QnLCBsaW5rXG4gICAgICAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUubmFtZV0gPSB0aGlzXG4gICAgICAgIHByaW50Lndhcm4gJ0hSRUYnLCBocmVmXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0KGFwcGxpZWRIUkVGKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rcz9bbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuYXBpQ2xpZW50LnR5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdMaW5rZWQsIGJ1dCBibGFuaydcbiAgICAgICMgSXQgZXhpc3RzLCBidXQgaXQncyBibGFuay5cbiAgICAgIFByb21pc2UucmVzb2x2ZSBudWxsXG5cbiAgIyBUdXJuIGEgSlNPTi1BUEkgXCJocmVmXCIgdGVtcGxhdGUgaW50byBhIHVzYWJsZSBVUkwuXG4gIFBMQUNFSE9MREVSU19QQVRURVJOOiAveyguKz8pfS9nXG4gIGFwcGx5SFJFRjogKGhyZWYsIGNvbnRleHQpIC0+XG4gICAgaHJlZi5yZXBsYWNlIEBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG4gICAgICBwcmludC53YXJuICdTZWdtZW50cycsIHNlZ21lbnRzXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBwcmludC53YXJuICdWYWx1ZScsIHZhbHVlXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIHVwZGF0ZTogKGNoYW5nZVNldCA9IHt9KSAtPlxuICAgIEBlbWl0ICd3aWxsLWNoYW5nZSdcbiAgICBhY3R1YWxDaGFuZ2VzID0gMFxuXG4gICAgZm9yIGtleSwgdmFsdWUgb2YgY2hhbmdlU2V0IHdoZW4gQFtrZXldIGlzbnQgdmFsdWVcbiAgICAgIEBba2V5XSA9IHZhbHVlXG4gICAgICB1bmxlc3Mga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgICAgQF9jaGFuZ2VkS2V5cy5wdXNoIGtleVxuICAgICAgYWN0dWFsQ2hhbmdlcyArPSAxXG5cbiAgICB1bmxlc3MgYWN0dWFsQ2hhbmdlcyBpcyAwXG4gICAgICBAZW1pdCAnY2hhbmdlJ1xuICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcblxuICBzYXZlOiAtPlxuICAgIEBlbWl0ICd3aWxsLXNhdmUnXG5cbiAgICBwYXlsb2FkID0ge31cbiAgICBwYXlsb2FkW0BfdHlwZS5uYW1lXSA9IEBnZXRDaGFuZ2VzU2luY2VTYXZlKClcblxuICAgIHNhdmUgPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucHV0IEBnZXRVUkwoKSwgcGF5bG9hZFxuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5hcGlDbGllbnQucG9zdCBAX3R5cGUuZ2V0VVJMKCksIHBheWxvYWRcblxuICAgIHNhdmUudGhlbiAoW3Jlc3VsdF0pID0+XG4gICAgICBAdXBkYXRlIHJlc3VsdFxuICAgICAgQF9jaGFuZ2VkS2V5cy5zcGxpY2UgMFxuICAgICAgQGVtaXQgJ3NhdmUnXG4gICAgICByZXN1bHRcblxuICByZWZyZXNoOiAtPlxuICAgIGlmIEBpZFxuICAgICAgQF90eXBlLmdldCBAaWRcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlamVjdCBuZXcgRXJyb3IgJ0NhblxcJ3QgcmVmcmVzaCBhIHJlc291cmNlIHdpdGggbm8gSUQnXG5cbiAgZ2V0Q2hhbmdlc1NpbmNlU2F2ZTogLT5cbiAgICBjaGFuZ2VzID0ge31cbiAgICBmb3Iga2V5IGluIEBfY2hhbmdlZEtleXNcbiAgICAgIGNoYW5nZXNba2V5XSA9IEBba2V5XVxuICAgIGNoYW5nZXNcblxuICBkZWxldGU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtZGVsZXRlJ1xuICAgIGRlbGV0aW9uID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LmRlbGV0ZShAZ2V0VVJMKCkpLnRoZW4gPT5cbiAgICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIGdldFVSTDogLT5cbiAgICBAaHJlZiB8fCBbQF90eXBlLmdldFVSTCgpLCBAaWRdLmpvaW4gJy8nXG5cbiAgdG9KU09OOiAtPlxuICAgIHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W0BfdHlwZS5uYW1lXSA9IHt9XG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkuY2hhckF0KDApIGlzbnQgJ18nIGFuZCBrZXkgbm90IGluIEBfcmVhZE9ubHlLZXlzXG4gICAgICByZXN1bHRbQF90eXBlLm5hbWVdW2tleV0gPSB2YWx1ZVxuICAgIHJlc3VsdFxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuZGVmZXIgPSAtPlxuICBkZWZlcnJhbCA9IHt9XG4gIGRlZmVycmFsLnByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIGRlZmVycmFsLnJlc29sdmUgPSByZXNvbHZlXG4gICAgZGVmZXJyYWwucmVqZWN0ID0gcmVqZWN0XG4gIGRlZmVycmFsXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZSBleHRlbmRzIEVtaXR0ZXJcbiAgbmFtZTogJydcbiAgYXBpQ2xpZW50OiBudWxsXG5cbiAgbGlua3M6IG51bGwgIyBSZXNvdXJjZSBsaW5rIGRlZmluaXRpb25zXG5cbiAgZGVmZXJyYWxzOiBudWxsICMgS2V5cyBhcmUgSURzIG9mIHNwZWNpZmljYWxseSByZXF1ZXN0ZWQgcmVzb3VyY2VzLlxuICByZXNvdXJjZVByb21pc2VzOiBudWxsICMgS2V5cyBhcmUgSURzLCB2YWx1ZXMgYXJlIHByb21pc2VzIHJlc29sdmluZyB0byByZXNvdXJjZXMuXG5cbiAgY29uc3RydWN0b3I6IChAbmFtZSwgQGFwaUNsaWVudCkgLT5cbiAgICBzdXBlclxuICAgIEBsaW5rcyA9IHt9XG4gICAgQGRlZmVycmFscyA9IHt9XG4gICAgQHJlc291cmNlUHJvbWlzZXMgPSB7fVxuICAgIHByaW50LmluZm8gJ0RlZmluZWQgYSBuZXcgdHlwZTonLCBAbmFtZVxuXG4gIGdldFVSTDogLT5cbiAgICAnLycgKyBAbmFtZVxuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBleGlzdExvY2FsbHkgPSAocHJvbWlzZSBmb3IgaWQsIHByb21pc2Ugb2YgQHJlc291cmNlUHJvbWlzZXMgd2hlbiBub3QgQHdhaXRpbmdGb3IgaWQpXG4gICAgUHJvbWlzZS5hbGwoZXhpc3RMb2NhbGx5KS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICByZXNvdXJjZSBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzIHdoZW4gcmVzb3VyY2UubWF0Y2hlc1F1ZXJ5IHF1ZXJ5XG5cbiAgd2FpdGluZ0ZvcjogKGlkKSAtPlxuICAgIEBkZWZlcnJhbHNbaWRdP1xuXG4gIGhhczogKGlkKSAtPlxuICAgIEByZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAZGVmZXJyYWxzW2lkXT9cblxuICBnZXQ6IC0+XG4gICAgaWYgdHlwZW9mIGFyZ3VtZW50c1swXSBpcyAnc3RyaW5nJ1xuICAgICAgQGdldEJ5SUQgYXJndW1lbnRzLi4uXG4gICAgZWxzZSBpZiBBcnJheS5pc0FycmF5IGFyZ3VtZW50c1swXVxuICAgICAgQGdldEJ5SURzIGFyZ3VtZW50cy4uLlxuICAgIGVsc2VcbiAgICAgIEBnZXRCeVF1ZXJ5IGFyZ3VtZW50cy4uLlxuXG4gIGdldEJ5SUQ6IChpZCwgb3RoZXJBcmdzLi4uKSAtPlxuICAgIEBnZXRCeUlEcyhbaWRdLCBvdGhlckFyZ3MuLi4pLnRoZW4gKFtyZXNvdXJjZV0pIC0+XG4gICAgICByZXNvdXJjZVxuXG4gIGdldEJ5SURzOiAoaWRzLCBvcHRpb25zLCBjYWxsYmFjaykgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nJywgQG5hbWUsICdieSBJRChzKScsIGlkc1xuICAgIGZvciBpZCBpbiBpZHNcbiAgICAgIEBkZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRdID0gQGRlZmVycmFsc1tpZF0ucHJvbWlzZVxuXG4gICAgdXJsID0gW0BnZXRVUkwoKSwgaWRzLmpvaW4gJywnXS5qb2luICcvJ1xuICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAbmFtZSwgJ2F0JywgdXJsXG4gICAgQGFwaUNsaWVudC5nZXQgdXJsLCBvcHRpb25zLCBudWxsLCBjYWxsYmFja1xuXG4gICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSwgY2FsbGJhY2spIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIGV4aXN0aW5nSURzID0gKGlkIGZvciB7aWR9IGluIGV4aXN0aW5nKVxuICAgICAgICBwYXJhbXMgPSB7fVxuICAgICAgICBpZiBpc0Zpbml0ZSBsaW1pdFxuICAgICAgICAgIHBhcmFtcy5saW1pdCA9IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5XG5cbiAgICAgICAgQGFwaUNsaWVudC5nZXQoQGdldFVSTCgpLCBwYXJhbXMsIG51bGwsIGNhbGxiYWNrKS50aGVuIChyZXNvdXJjZXMpIC0+XG4gICAgICAgICAgZmV0Y2hlZCA9IChyZXNvdXJjZSBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzIHdoZW4gcmVzb3VyY2UuaWQgbm90IGluIGV4aXN0aW5nSURzKVxuICAgICAgICAgIFByb21pc2UuYWxsIGV4aXN0aW5nLmNvbmNhdCBmZXRjaGVkXG5cbiAgYWRkRXhpc3RpbmdSZXNvdXJjZTogKGRhdGEpIC0+XG4gICAgaWYgQHdhaXRpbmdGb3IgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdEb25lIHdhaXRpbmcgZm9yJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBkZWZlcnJhbCA9IEBkZWZlcnJhbHNbZGF0YS5pZF1cbiAgICAgIEBkZWZlcnJhbHNbZGF0YS5pZF0gPSBudWxsXG4gICAgICBkZWZlcnJhbC5yZXNvbHZlIG5ld1Jlc291cmNlXG5cbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2FscmVhZHkgZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0FjY2VwdGluZycsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpcywgZGF0YVxuICAgICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF0gPSBQcm9taXNlLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgYSBuZXcnLCBAbmFtZSwgJ3Jlc291cmNlJ1xuICAgIHJlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzXG4gICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcbiAgICByZXNvdXJjZVxuIl19

