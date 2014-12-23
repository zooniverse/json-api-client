!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var DEFAULT_SIGNAL, Emitter, arraysMatch, callHandler,
  __slice = [].slice;

DEFAULT_SIGNAL = 'change';

arraysMatch = function(array1, array2) {
  var i, item, matches, _ref;
  matches = (function() {
    var _i, _len, _results;
    _results = [];
    for (i = _i = 0, _len = array1.length; _i < _len; i = ++_i) {
      item = array1[i];
      if (array2[i] === item) {
        _results.push(i);
      }
    }
    return _results;
  })();
  return (array1.length === (_ref = array2.length) && _ref === matches.length);
};

callHandler = function(handler, payload) {
  var boundArgs, context, _ref;
  if (Array.isArray(handler)) {
    _ref = handler, context = _ref[0], handler = _ref[1], boundArgs = 3 <= _ref.length ? __slice.call(_ref, 2) : [];
    if (typeof handler === 'string') {
      handler = context[handler];
    }
  } else {
    boundArgs = [];
  }
  handler.apply(context, boundArgs.concat(payload));
};

module.exports = Emitter = (function() {
  Emitter.prototype._callbacks = null;

  function Emitter() {
    this._callbacks = {};
  }

  Emitter.prototype.listen = function() {
    var callback, signal, _arg, _base, _i;
    _arg = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    signal = _arg[0];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if ((_base = this._callbacks)[signal] == null) {
      _base[signal] = [];
    }
    this._callbacks[signal].push(callback);
    return this;
  };

  Emitter.prototype.stopListening = function() {
    var callback, handler, i, index, signal, _arg, _i, _j, _ref;
    _arg = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    signal = _arg[0];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if (this._callbacks[signal] != null) {
      if (callback != null) {
        if (Array.isArray(callback)) {
          index = -1;
          _ref = this._callbacks[signal];
          for (i = _j = _ref.length - 1; _j >= 0; i = _j += -1) {
            handler = _ref[i];
            if (Array.isArray(handler)) {
              if (arraysMatch(callback, handler)) {
                index = i;
                break;
              }
            }
          }
        } else {
          index = this._callbacks[signal].lastIndexOf(callback);
        }
        if (index !== -1) {
          this._callbacks[signal].splice(index, 1);
        }
      } else {
        this._callbacks[signal].splice(0);
      }
    }
    return this;
  };

  Emitter.prototype.emit = function() {
    var callback, payload, signal, _i, _len, _ref;
    signal = arguments[0], payload = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (signal == null) {
      signal = DEFAULT_SIGNAL;
    }
    if (signal in this._callbacks) {
      _ref = this._callbacks[signal];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        callHandler(callback, payload);
      }
    }
    return this;
  };

  Emitter.prototype.destroy = function() {
    var callback, signal, _i, _len, _ref;
    for (signal in this._callbacks) {
      _ref = this._callbacks[signal];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        this.stopListening(signal, callback);
      }
    }
  };

  return Emitter;

})();



},{}],2:[function(_dereq_,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FB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QUFBLE1BQ0EsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFJLENBQUMsRUFBVixDQUFhLENBQUMsSUFBZCxDQUFtQixTQUFDLFFBQUQsR0FBQTtlQUNqQixRQUFRLENBQUMsTUFBVCxDQUFnQixJQUFoQixFQURpQjtNQUFBLENBQW5CLENBREEsQ0FERztLQUFBLE1BQUE7QUFNSCxNQUFBLEtBQUssQ0FBQyxHQUFOLENBQVUsV0FBVixFQUF1QixJQUFDLENBQUEsSUFBeEIsRUFBOEIsVUFBOUIsRUFBMEMsSUFBSSxDQUFDLEVBQS9DLENBQUEsQ0FBQTtBQUFBLE1BQ0EsV0FBQSxHQUFrQixJQUFBLFFBQUEsQ0FBUztBQUFBLFFBQUEsS0FBQSxFQUFPLElBQVA7T0FBVCxFQUFzQixJQUF0QixDQURsQixDQUFBO0FBQUEsTUFFQSxJQUFDLENBQUEsZ0JBQWlCLENBQUEsSUFBSSxDQUFDLEVBQUwsQ0FBbEIsR0FBNkIsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsV0FBaEIsQ0FGN0IsQ0FORztLQVBMO1dBaUJBLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFJLENBQUMsRUFBTCxFQWxCQztFQUFBLENBcEVyQixDQUFBOztBQUFBLGlCQXdGQSxjQUFBLEdBQWdCLFNBQUMsSUFBRCxHQUFBO0FBQ2QsUUFBQSxRQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGdCQUFWLEVBQTRCLElBQUMsQ0FBQSxJQUE3QixFQUFtQyxVQUFuQyxDQUFBLENBQUE7QUFBQSxJQUNBLFFBQUEsR0FBZSxJQUFBLFFBQUEsQ0FBUztBQUFBLE1BQUEsS0FBQSxFQUFPLElBQVA7S0FBVCxDQURmLENBQUE7QUFBQSxJQUVBLFFBQVEsQ0FBQyxNQUFULENBQWdCLElBQWhCLENBRkEsQ0FBQTtXQUdBLFNBSmM7RUFBQSxDQXhGaEIsQ0FBQTs7Y0FBQTs7R0FEa0MsUUFacEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJERUZBVUxUX1NJR05BTCA9ICdjaGFuZ2UnXG5cbmFycmF5c01hdGNoID0gKGFycmF5MSwgYXJyYXkyKSAtPlxuICBtYXRjaGVzID0gKGkgZm9yIGl0ZW0sIGkgaW4gYXJyYXkxIHdoZW4gYXJyYXkyW2ldIGlzIGl0ZW0pXG4gIGFycmF5MS5sZW5ndGggaXMgYXJyYXkyLmxlbmd0aCBpcyBtYXRjaGVzLmxlbmd0aFxuXG5jYWxsSGFuZGxlciA9IChoYW5kbGVyLCBwYXlsb2FkKSAtPlxuICAjIEhhbmRsZXJzIGNhbiBiZSBpbiB0aGUgZm9ybSBbY29udGV4dCwgZnVuY3Rpb24gb3IgbWV0aG9kIG5hbWUsIGJvdW5kIGFyZ3VtZW50cy4uLl1cbiAgaWYgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgIGhhbmRsZXIgPSBjb250ZXh0W2hhbmRsZXJdXG4gIGVsc2VcbiAgICBib3VuZEFyZ3MgPSBbXVxuICBoYW5kbGVyLmFwcGx5IGNvbnRleHQsIGJvdW5kQXJncy5jb25jYXQgcGF5bG9hZFxuICByZXR1cm5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoW3NpZ25hbF0uLi4sIGNhbGxiYWNrKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcbiAgICB0aGlzXG5cbiAgc3RvcExpc3RlbmluZzogKFtzaWduYWxdLi4uLCBjYWxsYmFjaykgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkgY2FsbGJhY2tcbiAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgIGZvciBoYW5kbGVyLCBpIGluIEBfY2FsbGJhY2tzW3NpZ25hbF0gYnkgLTEgd2hlbiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGlmIGFycmF5c01hdGNoIGNhbGxiYWNrLCBoYW5kbGVyXG4gICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICBlbHNlXG4gICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgIHVubGVzcyBpbmRleCBpcyAtMVxuICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICBlbHNlXG4gICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIDBcbiAgICB0aGlzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIGNhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG4gICAgdGhpc1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgZm9yIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsLCBjYWxsYmFja1xuICAgIHJldHVyblxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xubWFrZUhUVFBSZXF1ZXN0ID0gcmVxdWlyZSAnLi9tYWtlLWh0dHAtcmVxdWVzdCdcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblR5cGUgPSByZXF1aXJlICcuL3R5cGUnXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbkRFRkFVTFRfVFlQRV9BTkRfQUNDRVBUID1cbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG4gICdBY2NlcHQnOiBcImFwcGxpY2F0aW9uL3ZuZC5hcGkranNvblwiXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSlNPTkFQSUNsaWVudFxuICByb290OiAnLydcbiAgaGVhZGVyczogbnVsbFxuXG4gIHR5cGVzOiBudWxsICMgVHlwZXMgdGhhdCBoYXZlIGJlZW4gZGVmaW5lZFxuXG4gIGNvbnN0cnVjdG9yOiAoQHJvb3QsIEBoZWFkZXJzID0ge30pIC0+XG4gICAgQHR5cGVzID0ge31cbiAgICBwcmludC5pbmZvICdDcmVhdGVkIGEgbmV3IEpTT04tQVBJIGNsaWVudCBhdCcsIEByb290XG5cbiAgcmVxdWVzdDogKG1ldGhvZCwgdXJsLCBkYXRhLCBhZGRpdGlvbmFsSGVhZGVycywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnTWFraW5nIGEnLCBtZXRob2QsICdyZXF1ZXN0IHRvJywgdXJsXG4gICAgaGVhZGVycyA9IG1lcmdlSW50byB7fSwgREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQsIEBoZWFkZXJzLCBhZGRpdGlvbmFsSGVhZGVyc1xuICAgIG1ha2VIVFRQUmVxdWVzdCBtZXRob2QsIEByb290ICsgdXJsLCBkYXRhLCBoZWFkZXJzXG4gICAgICAudGhlbiAocmVxdWVzdCkgPT5cbiAgICAgICAgQHByb2Nlc3NSZXNwb25zZVRvIHJlcXVlc3QsIGNhbGxiYWNrXG4gICAgICAuY2F0Y2ggKHJlcXVlc3QpID0+XG4gICAgICAgIEBwcm9jZXNzRXJyb3JSZXNwb25zZVRvIHJlcXVlc3RcblxuICBmb3IgbWV0aG9kIGluIFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZSddIHRoZW4gZG8gKG1ldGhvZCkgPT5cbiAgICBAOjpbbWV0aG9kXSA9IC0+XG4gICAgICBAcmVxdWVzdCBtZXRob2QudG9VcHBlckNhc2UoKSwgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlVG86IChyZXF1ZXN0LCBjYWxsYmFjaykgLT5cbiAgICByZXNwb25zZSA9IHRyeSBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgcmVzcG9uc2UgPz0ge31cbiAgICBwcmludC5sb2cgJ1Byb2Nlc3NpbmcgcmVzcG9uc2UnLCByZXNwb25zZVxuXG4gICAgaWYgJ2xpbmtzJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGVBbmRBdHRyaWJ1dGUsIGxpbmsgb2YgcmVzcG9uc2UubGlua3NcbiAgICAgICAgW3R5cGUsIGF0dHJpYnV0ZV0gPSB0eXBlQW5kQXR0cmlidXRlLnNwbGl0ICcuJ1xuICAgICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICAgIGhyZWYgPSBsaW5rXG4gICAgICAgIGVsc2VcbiAgICAgICAgICB7aHJlZiwgdHlwZTogYXR0cmlidXRlVHlwZX0gPSBsaW5rXG5cbiAgICAgICAgQGhhbmRsZUxpbmsgdHlwZSwgYXR0cmlidXRlLCBocmVmLCBhdHRyaWJ1dGVUeXBlXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCByZXNvdXJjZXMgPyAxLCAnbGlua2VkJywgdHlwZSwgJ3Jlc291cmNlcy4nXG4gICAgICAgIEBjcmVhdGVUeXBlIHR5cGVcbiAgICAgICAgZm9yIHJlc291cmNlIGluIFtdLmNvbmNhdCByZXNvdXJjZXNcbiAgICAgICAgICBAdHlwZXNbdHlwZV0uYWRkRXhpc3RpbmdSZXNvdXJjZSByZXNvdXJjZVxuXG4gICAgaWYgJ2RhdGEnIG9mIHJlc3BvbnNlXG4gICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCBcImRhdGFcIiBjb2xsZWN0aW9uIG9mJywgcmVzcG9uc2UuZGF0YS5sZW5ndGggPyAxXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzcG9uc2UuZGF0YVxuICAgICAgICBAY3JlYXRlVHlwZSByZXNwb25zZS50eXBlXG4gICAgICAgIEB0eXBlc1tyZXNwb25zZS50eXBlXS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG4gICAgZWxzZVxuICAgICAgcHJpbWFyeVJlc3VsdHMgPSBbXVxuICAgICAgZm9yIHR5cGUsIHJlc291cmNlcyBvZiByZXNwb25zZSB3aGVuIHR5cGUgbm90IGluIFsnbGlua3MnLCAnbGlua2VkJywgJ21ldGEnLCAnZGF0YSddXG4gICAgICAgIHByaW50LmxvZyAnR290IGEgdG9wLWxldmVsJywgdHlwZSwgJ2NvbGxlY3Rpb24gb2YnLCByZXNvdXJjZXMubGVuZ3RoID8gMVxuICAgICAgICBAY3JlYXRlVHlwZSB0eXBlXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzb3VyY2VzXG4gICAgICAgICAgcHJpbWFyeVJlc3VsdHMucHVzaCBAdHlwZXNbdHlwZV0uYWRkRXhpc3RpbmdSZXNvdXJjZSByZXNvdXJjZVxuXG4gICAgcHJpbnQuaW5mbyAnUHJpbWFyeSByZXNvdXJjZXM6JywgcHJpbWFyeVJlc3VsdHNcbiAgICBjYWxsYmFjaz8gcmVxdWVzdCwgcmVzcG9uc2VcbiAgICBQcm9taXNlLmFsbCBwcmltYXJ5UmVzdWx0c1xuXG4gIGhhbmRsZUxpbms6ICh0eXBlTmFtZSwgYXR0cmlidXRlTmFtZSwgaHJlZlRlbXBsYXRlLCBhdHRyaWJ1dGVUeXBlTmFtZSkgLT5cbiAgICB0eXBlID0gQGNyZWF0ZVR5cGUgdHlwZU5hbWVcblxuICAgIHR5cGUubGlua3NbYXR0cmlidXRlTmFtZV0gPz0ge31cbiAgICBpZiBocmVmVGVtcGxhdGU/XG4gICAgICB0eXBlLmxpbmtzW2F0dHJpYnV0ZU5hbWVdLmhyZWYgPSBocmVmVGVtcGxhdGVcbiAgICBpZiBhdHRyaWJ1dGVUeXBlTmFtZT9cbiAgICAgIHR5cGUubGlua3NbYXR0cmlidXRlTmFtZV0udHlwZSA9IGF0dHJpYnV0ZVR5cGVOYW1lXG5cbiAgY3JlYXRlVHlwZTogKG5hbWUpIC0+XG4gICAgQHR5cGVzW25hbWVdID89IG5ldyBUeXBlIG5hbWUsIHRoaXNcbiAgICBAdHlwZXNbbmFtZV1cblxuICBwcm9jZXNzRXJyb3JSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICBQcm9taXNlLnJlamVjdCB0cnlcbiAgICAgIEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICBjYXRjaFxuICAgICAgbmV3IEVycm9yIHJlcXVlc3QucmVzcG9uc2VUZXh0IHx8IHJlcXVlc3Quc3RhdHVzXG5cbm1vZHVsZS5leHBvcnRzLnV0aWwgPSB7bWFrZUhUVFBSZXF1ZXN0fVxubW9kdWxlLmV4cG9ydHMuVHlwZSA9IFR5cGVcbm1vZHVsZS5leHBvcnRzLlJlc291cmNlID0gUmVzb3VyY2VcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcblxuIyBNYWtlIGEgcmF3LCBub24tQVBJIHNwZWNpZmljIEhUVFAgcmVxdWVzdC5cblxubW9kdWxlLmV4cG9ydHMgPSAobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMsIG1vZGlmeSkgLT5cbiAgcHJpbnQuaW5mbyAnUmVxdWVzdGluZycsIG1ldGhvZCwgdXJsLCBkYXRhXG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgaWYgZGF0YT8gYW5kIG1ldGhvZCBpcyAnR0VUJ1xuICAgICAgdXJsICs9ICc/JyArIChba2V5LCB2YWx1ZV0uam9pbiAnPScgZm9yIGtleSwgdmFsdWUgb2YgZGF0YSkuam9pbiAnJidcbiAgICAgIGRhdGEgPSBudWxsXG5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG5cbiAgICBpZiBoZWFkZXJzP1xuICAgICAgZm9yIGhlYWRlciwgdmFsdWUgb2YgaGVhZGVyc1xuICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIgaGVhZGVyLCB2YWx1ZVxuXG4gICAgaWYgbW9kaWZ5P1xuICAgICAgbW9kaWZpY2F0aW9ucyA9IG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgcHJpbnQubG9nICdSZWFkeSBzdGF0ZTonLCAoa2V5IGZvciBrZXksIHZhbHVlIG9mIHJlcXVlc3Qgd2hlbiB2YWx1ZSBpcyByZXF1ZXN0LnJlYWR5U3RhdGUgYW5kIGtleSBpc250ICdyZWFkeVN0YXRlJylbMF1cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgcHJpbnQubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZSAjIGlmIDQwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDYwMFxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICBpZiBkYXRhIGluc3RhbmNlb2YgQmxvYlxuICAgICAgcmVxdWVzdC5zZW5kIGRhdGFcbiAgICBlbHNlXG4gICAgICByZXF1ZXN0LnNlbmQgSlNPTi5zdHJpbmdpZnkgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsInByaW50ID0gKGxldmVsLCBjb2xvciwgbWVzc2FnZXMuLi4pIC0+XG4gICMgU2V0IHRoZSBsb2cgbGV2ZWwgd2l0aCBhIGdsb2JhbCB2YXJpYWJsZSBvciBhIHF1ZXJ5IHBhcmFtIGluIHRoZSBwYWdlJ3MgVVJMLlxuICBzZXR0aW5nID0gSlNPTl9BUElfTE9HX0xFVkVMID8gcGFyc2VGbG9hdCBsb2NhdGlvbj8uc2VhcmNoLm1hdGNoKC9qc29uLWFwaS1sb2c9KFxcZCspLyk/WzFdID8gMFxuXG4gIGlmIHNldHRpbmcgPj0gbGV2ZWxcbiAgICAjIFdlIGNhbiBzdHlsZSB0ZXh0IGluIHRoZSBicm93c2VyIGNvbnNvbGUsIGJ1dCBub3QgYXMgZWFzaWx5IGluIE5vZGUuXG4gICAgcHJlZml4ID0gaWYgbG9jYXRpb24/XG4gICAgICBbJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCJdXG4gICAgZWxzZVxuICAgICAgWyd7anNvbjphcGl9J11cblxuICAgIGNvbnNvbGU/LmxvZyBwcmVmaXguLi4sIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsIDQsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsIDMsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsIDIsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsIDEsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBfdHlwZTogbnVsbCAjIFRoZSByZXNvdXJjZSB0eXBlIG9iamVjdFxuXG4gIF9yZWFkT25seUtleXM6IFsnaWQnLCAndHlwZScsICdocmVmJywgJ2NyZWF0ZWRfYXQnLCAndXBkYXRlZF9hdCddXG5cbiAgX2NoYW5nZWRLZXlzOiBudWxsICMgRGlydHkga2V5c1xuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgQF9jaGFuZ2VkS2V5cyA9IFtdXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLiBpZiBjb25maWc/XG4gICAgQGVtaXQgJ2NyZWF0ZSdcbiAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuICAgIHByaW50LmluZm8gXCJDb25zdHJ1Y3RlZCBhIHJlc291cmNlOiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIiwgdGhpc1xuXG4gICMgR2V0IGEgcHJvbWlzZSBmb3IgYW4gYXR0cmlidXRlIHJlZmVycmluZyB0byAoYW4pb3RoZXIgcmVzb3VyY2UocykuXG4gIGF0dHI6IChhdHRyaWJ1dGUpIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZyBsaW5rOicsIGF0dHJpYnV0ZVxuICAgIGlmIGF0dHJpYnV0ZSBvZiB0aGlzXG4gICAgICBwcmludC53YXJuIFwiTm8gbmVlZCB0byBhY2Nlc3MgYSBub24tbGlua2VkIGF0dHJpYnV0ZSB2aWEgYXR0cjogI3thdHRyaWJ1dGV9XCIsIHRoaXNcbiAgICAgIFByb21pc2UucmVzb2x2ZSBAW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIEBsaW5rcz8gYW5kIGF0dHJpYnV0ZSBvZiBAbGlua3NcbiAgICAgIHByaW50LmxvZyAnTGluayBvZiByZXNvdXJjZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBsaW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBhdHRyaWJ1dGUgb2YgQF90eXBlLmxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgdHlwZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBfdHlwZS5saW5rc1thdHRyaWJ1dGVdXG4gICAgZWxzZVxuICAgICAgcHJpbnQuZXJyb3IgJ05vdCBhIGxpbmsgYXQgYWxsJ1xuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yIFwiTm8gYXR0cmlidXRlICN7YXR0cmlidXRlfSBvZiAje0BfdHlwZS5uYW1lfSByZXNvdXJjZVwiXG5cbiAgX2dldExpbms6IChuYW1lLCBsaW5rKSAtPlxuICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgbGlua1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgSUQocyknXG4gICAgICBpZHMgPSBsaW5rXG4gICAgICB7aHJlZiwgdHlwZX0gPSBAX3R5cGUubGlua3NbbmFtZV1cblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBhcHBsaWVkSFJFRiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldChhcHBsaWVkSFJFRikudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIGlmIHR5cGVvZiBAbGlua3M/W25hbWVdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXNvdXJjZXNbMF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvdXJjZXNcblxuICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2UgaWYgbGluaz9cbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IGNvbGxlY3Rpb24gb2JqZWN0JywgbGlua1xuICAgICAgIyBJdCdzIGEgY29sbGVjdGlvbiBvYmplY3QuXG4gICAgICB7aHJlZiwgaWRzLCB0eXBlfSA9IGxpbmtcblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBwcmludC53YXJuICdIUkVGJywgaHJlZlxuICAgICAgICBhcHBsaWVkSFJFRiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuYXBpQ2xpZW50LmdldChhcHBsaWVkSFJFRikudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIGlmIHR5cGVvZiBAbGlua3M/W25hbWVdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXNvdXJjZXNbMF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvdXJjZXNcblxuICAgICAgZWxzZSBpZiB0eXBlPyBhbmQgaWRzP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnTGlua2VkLCBidXQgYmxhbmsnXG4gICAgICAjIEl0IGV4aXN0cywgYnV0IGl0J3MgYmxhbmsuXG4gICAgICBQcm9taXNlLnJlc29sdmUgbnVsbFxuXG4gICMgVHVybiBhIEpTT04tQVBJIFwiaHJlZlwiIHRlbXBsYXRlIGludG8gYSB1c2FibGUgVVJMLlxuICBQTEFDRUhPTERFUlNfUEFUVEVSTjogL3soLis/KX0vZ1xuICBhcHBseUhSRUY6IChocmVmLCBjb250ZXh0KSAtPlxuICAgIGhyZWYucmVwbGFjZSBAUExBQ0VIT0xERVJTX1BBVFRFUk4sIChfLCBwYXRoKSAtPlxuICAgICAgc2VnbWVudHMgPSBwYXRoLnNwbGl0ICcuJ1xuICAgICAgcHJpbnQud2FybiAnU2VnbWVudHMnLCBzZWdtZW50c1xuXG4gICAgICB2YWx1ZSA9IGNvbnRleHRcbiAgICAgIHVudGlsIHNlZ21lbnRzLmxlbmd0aCBpcyAwXG4gICAgICAgIHNlZ21lbnQgPSBzZWdtZW50cy5zaGlmdCgpXG4gICAgICAgIHZhbHVlID0gdmFsdWVbc2VnbWVudF0gPyB2YWx1ZS5saW5rcz9bc2VnbWVudF1cblxuICAgICAgcHJpbnQud2FybiAnVmFsdWUnLCB2YWx1ZVxuXG4gICAgICBpZiBBcnJheS5pc0FycmF5IHZhbHVlXG4gICAgICAgIHZhbHVlID0gdmFsdWUuam9pbiAnLCdcblxuICAgICAgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJWYWx1ZSBmb3IgJyN7cGF0aH0nIGluICcje2hyZWZ9JyBzaG91bGQgYmUgYSBzdHJpbmcuXCJcblxuICAgICAgdmFsdWVcblxuICB1cGRhdGU6IChjaGFuZ2VTZXQgPSB7fSkgLT5cbiAgICBAZW1pdCAnd2lsbC1jaGFuZ2UnXG4gICAgYWN0dWFsQ2hhbmdlcyA9IDBcblxuICAgIGZvciBrZXksIHZhbHVlIG9mIGNoYW5nZVNldCB3aGVuIEBba2V5XSBpc250IHZhbHVlXG4gICAgICBAW2tleV0gPSB2YWx1ZVxuICAgICAgdW5sZXNzIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICAgIEBfY2hhbmdlZEtleXMucHVzaCBrZXlcbiAgICAgIGFjdHVhbENoYW5nZXMgKz0gMVxuXG4gICAgdW5sZXNzIGFjdHVhbENoYW5nZXMgaXMgMFxuICAgICAgQGVtaXQgJ2NoYW5nZSdcbiAgICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuXG4gICAgcGF5bG9hZCA9IHt9XG4gICAgcGF5bG9hZFtAX3R5cGUubmFtZV0gPSBAZ2V0Q2hhbmdlc1NpbmNlU2F2ZSgpXG5cbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnB1dCBAZ2V0VVJMKCksIHBheWxvYWRcbiAgICBlbHNlXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LnBvc3QgQF90eXBlLmdldFVSTCgpLCBwYXlsb2FkXG5cbiAgICBzYXZlLnRoZW4gKFtyZXN1bHRdKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRcbiAgICAgIEBfY2hhbmdlZEtleXMuc3BsaWNlIDBcbiAgICAgIEBlbWl0ICdzYXZlJ1xuICAgICAgcmVzdWx0XG5cbiAgcmVmcmVzaDogLT5cbiAgICBpZiBAaWRcbiAgICAgIEBfdHlwZS5nZXQgQGlkXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZWplY3QgbmV3IEVycm9yICdDYW5cXCd0IHJlZnJlc2ggYSByZXNvdXJjZSB3aXRoIG5vIElEJ1xuXG4gIGdldENoYW5nZXNTaW5jZVNhdmU6IC0+XG4gICAgY2hhbmdlcyA9IHt9XG4gICAgZm9yIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICBjaGFuZ2VzW2tleV0gPSBAW2tleV1cbiAgICBjaGFuZ2VzXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5kZWxldGUoQGdldFVSTCgpKS50aGVuID0+XG4gICAgICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbWF0Y2hlc1F1ZXJ5OiAocXVlcnkpIC0+XG4gICAgbWF0Y2hlcyA9IHRydWVcbiAgICBmb3IgcGFyYW0sIHZhbHVlIG9mIHF1ZXJ5XG4gICAgICBpZiBAW3BhcmFtXSBpc250IHZhbHVlXG4gICAgICAgIG1hdGNoZXMgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgIG1hdGNoZXNcblxuICBnZXRVUkw6IC0+XG4gICAgQGhyZWYgfHwgW0BfdHlwZS5nZXRVUkwoKSwgQGlkXS5qb2luICcvJ1xuXG4gIHRvSlNPTjogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIHJlc3VsdFtAX3R5cGUubmFtZV0gPSB7fVxuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5LmNoYXJBdCgwKSBpc250ICdfJyBhbmQga2V5IG5vdCBpbiBAX3JlYWRPbmx5S2V5c1xuICAgICAgcmVzdWx0W0BfdHlwZS5uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIG5hbWU6ICcnXG4gIGFwaUNsaWVudDogbnVsbFxuXG4gIGxpbmtzOiBudWxsICMgUmVzb3VyY2UgbGluayBkZWZpbml0aW9uc1xuXG4gIGRlZmVycmFsczogbnVsbCAjIEtleXMgYXJlIElEcyBvZiBzcGVjaWZpY2FsbHkgcmVxdWVzdGVkIHJlc291cmNlcy5cbiAgcmVzb3VyY2VQcm9taXNlczogbnVsbCAjIEtleXMgYXJlIElEcywgdmFsdWVzIGFyZSBwcm9taXNlcyByZXNvbHZpbmcgdG8gcmVzb3VyY2VzLlxuXG4gIGNvbnN0cnVjdG9yOiAoQG5hbWUsIEBhcGlDbGllbnQpIC0+XG4gICAgc3VwZXJcbiAgICBAbGlua3MgPSB7fVxuICAgIEBkZWZlcnJhbHMgPSB7fVxuICAgIEByZXNvdXJjZVByb21pc2VzID0ge31cbiAgICBwcmludC5pbmZvICdEZWZpbmVkIGEgbmV3IHR5cGU6JywgQG5hbWVcblxuICBnZXRVUkw6IC0+XG4gICAgJy8nICsgQG5hbWVcblxuICBxdWVyeUxvY2FsOiAocXVlcnkpIC0+XG4gICAgZXhpc3RMb2NhbGx5ID0gKHByb21pc2UgZm9yIGlkLCBwcm9taXNlIG9mIEByZXNvdXJjZVByb21pc2VzIHdoZW4gbm90IEB3YWl0aW5nRm9yIGlkKVxuICAgIFByb21pc2UuYWxsKGV4aXN0TG9jYWxseSkudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlLm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAZGVmZXJyYWxzW2lkXT9cblxuICBoYXM6IChpZCkgLT5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0/IGFuZCBub3QgQGRlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZydcbiAgICAgIEBnZXRCeUlEIGFyZ3VtZW50cy4uLlxuICAgIGVsc2UgaWYgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICBnZXRCeUlEOiAoaWQsIG90aGVyQXJncy4uLikgLT5cbiAgICBAZ2V0QnlJRHMoW2lkXSwgb3RoZXJBcmdzLi4uKS50aGVuIChbcmVzb3VyY2VdKSAtPlxuICAgICAgcmVzb3VyY2VcblxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBuYW1lLCAnYnkgSUQocyknLCBpZHNcbiAgICBmb3IgaWQgaW4gaWRzXG4gICAgICBAZGVmZXJyYWxzW2lkXSA9IGRlZmVyKClcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2lkXSA9IEBkZWZlcnJhbHNbaWRdLnByb21pc2VcblxuICAgIHVybCA9IFtAZ2V0VVJMKCksIGlkcy5qb2luICcsJ10uam9pbiAnLydcbiAgICBwcmludC5sb2cgJ1JlcXVlc3QgZm9yJywgQG5hbWUsICdhdCcsIHVybFxuICAgIEBhcGlDbGllbnQuZ2V0IHVybCwgb3B0aW9ucywgbnVsbCwgY2FsbGJhY2tcblxuICAgIFByb21pc2UuYWxsIChAcmVzb3VyY2VQcm9taXNlc1tpZF0gZm9yIGlkIGluIGlkcylcblxuICBnZXRCeVF1ZXJ5OiAocXVlcnksIGxpbWl0ID0gSW5maW5pdHksIGNhbGxiYWNrKSAtPlxuICAgIEBxdWVyeUxvY2FsKHF1ZXJ5KS50aGVuIChleGlzdGluZykgPT5cbiAgICAgIGlmIGV4aXN0aW5nLmxlbmd0aCA+PSBsaW1pdFxuICAgICAgICBleGlzdGluZ1xuICAgICAgZWxzZVxuICAgICAgICBleGlzdGluZ0lEcyA9IChpZCBmb3Ige2lkfSBpbiBleGlzdGluZylcbiAgICAgICAgcGFyYW1zID0ge31cbiAgICAgICAgaWYgaXNGaW5pdGUgbGltaXRcbiAgICAgICAgICBwYXJhbXMubGltaXQgPSBsaW1pdCAtIGV4aXN0aW5nLmxlbmd0aFxuICAgICAgICBtZXJnZUludG8gcGFyYW1zLCBxdWVyeVxuXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgcGFyYW1zLCBudWxsLCBjYWxsYmFjaykudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgICAgIGZldGNoZWQgPSAocmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlLmlkIG5vdCBpbiBleGlzdGluZ0lEcylcbiAgICAgICAgICBQcm9taXNlLmFsbCBleGlzdGluZy5jb25jYXQgZmV0Y2hlZFxuXG4gIGFkZEV4aXN0aW5nUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIGlmIEB3YWl0aW5nRm9yIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnRG9uZSB3YWl0aW5nIGZvcicsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBuZXdSZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpcywgZGF0YVxuICAgICAgZGVmZXJyYWwgPSBAZGVmZXJyYWxzW2RhdGEuaWRdXG4gICAgICBAZGVmZXJyYWxzW2RhdGEuaWRdID0gbnVsbFxuICAgICAgZGVmZXJyYWwucmVzb2x2ZSBuZXdSZXNvdXJjZVxuXG4gICAgZWxzZSBpZiBAaGFzIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnVGhlJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWQsICdhbHJlYWR5IGV4aXN0czsgd2lsbCB1cGRhdGUnXG4gICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuXG4gICAgZWxzZVxuICAgICAgcHJpbnQubG9nICdBY2NlcHRpbmcnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgbmV3UmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXMsIGRhdGFcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdID0gUHJvbWlzZS5yZXNvbHZlIG5ld1Jlc291cmNlXG5cbiAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXVxuXG4gIGNyZWF0ZVJlc291cmNlOiAoZGF0YSkgLT5cbiAgICBwcmludC5sb2cgJ0NyZWF0aW5nIGEgbmV3JywgQG5hbWUsICdyZXNvdXJjZSdcbiAgICByZXNvdXJjZSA9IG5ldyBSZXNvdXJjZSBfdHlwZTogdGhpc1xuICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG4gICAgcmVzb3VyY2VcbiJdfQ==

