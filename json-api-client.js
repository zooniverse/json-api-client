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

  JSONAPIClient.prototype._types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
    this._types = {};
    print.info('Created a new JSON-API client at', this.root);
  }

  JSONAPIClient.prototype.request = function(method, url, data, additionalHeaders, callback) {
    var headers;
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
      return this.request.apply(this, [method].concat(__slice.call(arguments)));
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    method = _ref[_i];
    _fn(method);
  }

  JSONAPIClient.prototype.processResponseTo = function(request, callback) {
    var data, linked, primaryResults, resource, resources, response, type, typeName, _j, _k, _len1, _len2, _ref1;
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
      this._handleLinks(response.links);
    }
    if ('linked' in response) {
      _ref1 = response.linked;
      for (type in _ref1) {
        linked = _ref1[type];
        linked = [].concat(linked);
        print.log('Got', linked.length, 'linked', type, 'resource(s)');
        for (_j = 0, _len1 = linked.length; _j < _len1; _j++) {
          resource = linked[_j];
          this.type(type).addExistingResource(resource);
        }
      }
    }
    if ('data' in response) {
      data = [].concat(response.data);
      print.log('Got a top-level "data" collection of', data.length, 'resource(s)');
      primaryResults = (function() {
        var _k, _len2, _results;
        _results = [];
        for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
          resource = data[_k];
          _results.push(this.type(resource.type).addExistingResource(resource));
        }
        return _results;
      }).call(this);
    } else {
      primaryResults = [];
      for (typeName in response) {
        resources = response[typeName];
        if (!(typeName !== 'meta' && typeName !== 'links' && typeName !== 'linked' && typeName !== 'data')) {
          continue;
        }
        type = this.type(typeName);
        resources = [].concat(resources);
        print.log('Got a top-level', type, 'collection of', resources.length, 'resource(s)');
        for (_k = 0, _len2 = resources.length; _k < _len2; _k++) {
          resource = resources[_k];
          primaryResults.push(type.addExistingResource(resource));
        }
      }
    }
    print.info('Primary resources:', primaryResults);
    if (typeof callback === "function") {
      callback(request, response);
    }
    return Promise.all(primaryResults);
  };

  JSONAPIClient.prototype._handleLinks = function(links) {
    var attributeName, href, link, type, typeAndAttribute, typeName, _ref1, _results;
    _results = [];
    for (typeAndAttribute in links) {
      link = links[typeAndAttribute];
      _ref1 = typeAndAttribute.split('.'), typeName = _ref1[0], attributeName = _ref1[1];
      if (typeof link === 'string') {
        href = link;
      } else {
        href = link.href, type = link.type;
      }
      _results.push(this._handleLink(typeName, attributeName, href, type));
    }
    return _results;
  };

  JSONAPIClient.prototype._handleLink = function(typeName, attributeName, hrefTemplate, attributeTypeName) {
    var type, _base;
    type = this.type(typeName);
    if ((_base = type._links)[attributeName] == null) {
      _base[attributeName] = {};
    }
    if (hrefTemplate != null) {
      type._links[attributeName].href = hrefTemplate;
    }
    if (attributeTypeName != null) {
      return type._links[attributeName].type = attributeTypeName;
    }
  };

  JSONAPIClient.prototype.type = function(name) {
    var _base;
    if ((_base = this._types)[name] == null) {
      _base[name] = new Type(name, this);
    }
    return this._types[name];
  };

  JSONAPIClient.prototype.createType = function() {
    console.warn.apply(console, ['Use JSONAPIClient::type, not ::createType'].concat(__slice.call(arguments)));
    return this.type.apply(this, arguments);
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
  return new Promise(function(resolve, reject) {
    var header, key, request, value;
    method = method.toUpperCase();
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
    print.info('Requesting', method, url, data);
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
      modify(request);
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
    if ((headers != null ? headers['Content-Type'].indexOf('json') : void 0) !== -1) {
      data = JSON.stringify(data);
    }
    return request.send(data);
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
    mergeInto.apply(null, [this].concat(__slice.call(config)));
    this.emit('create');
    this._type.emit('change');
    print.info("Constructed a resource: " + this._type._name + " " + this.id, this);
  }

  Resource.prototype.link = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      print.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      return Promise.resolve(this[attribute]);
    } else if ((this.links != null) && attribute in this.links) {
      print.log('Link of resource');
      return this._getLink(attribute, this.links[attribute]);
    } else if (attribute in this._type._links) {
      print.log('Link of type');
      return this._getLink(attribute, this._type._links[attribute]);
    } else {
      print.error('Not a link at all');
      return Promise.reject(new Error("No attribute " + attribute + " of " + this._type._name + " resource"));
    }
  };

  Resource.prototype.attr = function() {
    console.warn.apply(console, ['Use Resource::link, not ::attr'].concat(__slice.call(arguments)));
    return this.link.apply(this, arguments);
  };

  Resource.prototype._getLink = function(name, link) {
    var appliedHREF, context, href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      print.log('Linked by ID(s)');
      ids = link;
      _ref = this._type._links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        context = {};
        context[this._type._name] = this;
        appliedHREF = this.applyHREF(href, context);
        return this._type._apiClient.get(appliedHREF).then((function(_this) {
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
        type = this._type._apiClient._types[type];
        return type.get(ids);
      }
    } else if (link != null) {
      print.log('Linked by collection object', link);
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        context = {};
        context[this._type._name] = this;
        print.warn('HREF', href);
        appliedHREF = this.applyHREF(href, context);
        return this._type._apiClient.get(appliedHREF).then((function(_this) {
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
        type = this._type._apiClient._types[type];
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
    payload[this._type._name] = this.getChangesSinceSave();
    save = this.id ? this._type._apiClient.put(this.getURL(), payload) : this._type._apiClient.post(this._type._getURL(), payload);
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
    deletion = this.id ? this._type._apiClient["delete"](this.getURL()).then((function(_this) {
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
    return this.href || this._type._getURL(this.id);
  };

  Resource.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    result[this._type._name] = {};
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if (key.charAt(0) !== '_' && __indexOf.call(this._readOnlyKeys, key) < 0) {
        result[this._type._name][key] = value;
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

  Type.prototype._name = '';

  Type.prototype._apiClient = null;

  Type.prototype._links = null;

  Type.prototype._deferrals = null;

  Type.prototype._resourcePromises = null;

  function Type(_name, _apiClient) {
    this._name = _name;
    this._apiClient = _apiClient;
    Type.__super__.constructor.apply(this, arguments);
    this._links = {};
    this._deferrals = {};
    this._resourcePromises = {};
    print.info('Defined a new type:', this._name);
  }

  Type.prototype._getURL = function() {
    return [null, this._name].concat(__slice.call(arguments)).join('/');
  };

  Type.prototype.queryLocal = function(query) {
    var existLocally, id, promise;
    existLocally = (function() {
      var _ref, _results;
      _ref = this._resourcePromises;
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
    return this._deferrals[id] != null;
  };

  Type.prototype.has = function(id) {
    return (this._resourcePromises[id] != null) && (this._deferrals[id] == null);
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
    print.info('Getting', this._name, 'by ID(s)', ids);
    for (_i = 0, _len = ids.length; _i < _len; _i++) {
      id = ids[_i];
      this._deferrals[id] = defer();
      this._resourcePromises[id] = this._deferrals[id].promise;
    }
    url = [this._getURL(), ids.join(',')].join('/');
    print.log('Request for', this._name, 'at', url);
    this._apiClient.get(url, options, null, callback);
    return Promise.all((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
        id = ids[_j];
        _results.push(this._resourcePromises[id]);
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
          return _this._apiClient.get(_this._getURL(), params, null, callback).then(function(resources) {
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
      print.log('Done waiting for', this._name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      deferral = this._deferrals[data.id];
      this._deferrals[data.id] = null;
      deferral.resolve(newResource);
    } else if (this.has(data.id)) {
      print.log('The', this._name, 'resource', data.id, 'already exists; will update');
      this.get(data.id).then(function(resource) {
        return resource.update(data);
      });
    } else {
      print.log('Accepting', this._name, 'resource', data.id);
      newResource = new Resource({
        _type: this
      }, data);
      this._resourcePromises[data.id] = Promise.resolve(newResource);
    }
    return this._resourcePromises[data.id];
  };

  Type.prototype.create = function(data) {
    var resource;
    print.log('Creating a new', this._name, 'resource');
    resource = new Resource({
      _type: this
    });
    resource.update(data);
    return resource;
  };

  Type.prototype.createResource = function() {
    console.warn.apply(console, ['Use Type::create, not ::createResource'].concat(__slice.call(arguments)));
    return this.create.apply(this, arguments);
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FB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QThCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLFdBQWhCLENBRjlCLENBTkc7S0FQTDtXQWlCQSxJQUFDLENBQUEsaUJBQWtCLENBQUEsSUFBSSxDQUFDLEVBQUwsRUFsQkE7RUFBQSxDQXBFckIsQ0FBQTs7QUFBQSxpQkF3RkEsTUFBQSxHQUFRLFNBQUMsSUFBRCxHQUFBO0FBQ04sUUFBQSxRQUFBO0FBQUEsSUFBQSxLQUFLLENBQUMsR0FBTixDQUFVLGdCQUFWLEVBQTRCLElBQUMsQ0FBQSxLQUE3QixFQUFvQyxVQUFwQyxDQUFBLENBQUE7QUFBQSxJQUNBLFFBQUEsR0FBZSxJQUFBLFFBQUEsQ0FBUztBQUFBLE1BQUEsS0FBQSxFQUFPLElBQVA7S0FBVCxDQURmLENBQUE7QUFBQSxJQUVBLFFBQVEsQ0FBQyxNQUFULENBQWdCLElBQWhCLENBRkEsQ0FBQTtXQUdBLFNBSk07RUFBQSxDQXhGUixDQUFBOztBQUFBLGlCQThGQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtBQUNkLElBQUEsT0FBTyxDQUFDLElBQVIsZ0JBQWEsQ0FBQSx3Q0FBMEMsU0FBQSxhQUFBLFNBQUEsQ0FBQSxDQUF2RCxDQUFBLENBQUE7V0FDQSxJQUFDLENBQUEsTUFBRCxhQUFRLFNBQVIsRUFGYztFQUFBLENBOUZoQixDQUFBOztjQUFBOztHQURrQyxRQVpwQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIkRFRkFVTFRfU0lHTkFMID0gJ2NoYW5nZSdcblxuYXJyYXlzTWF0Y2ggPSAoYXJyYXkxLCBhcnJheTIpIC0+XG4gIG1hdGNoZXMgPSAoaSBmb3IgaXRlbSwgaSBpbiBhcnJheTEgd2hlbiBhcnJheTJbaV0gaXMgaXRlbSlcbiAgYXJyYXkxLmxlbmd0aCBpcyBhcnJheTIubGVuZ3RoIGlzIG1hdGNoZXMubGVuZ3RoXG5cbmNhbGxIYW5kbGVyID0gKGhhbmRsZXIsIHBheWxvYWQpIC0+XG4gICMgSGFuZGxlcnMgY2FuIGJlIGluIHRoZSBmb3JtIFtjb250ZXh0LCBmdW5jdGlvbiBvciBtZXRob2QgbmFtZSwgYm91bmQgYXJndW1lbnRzLi4uXVxuICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICBbY29udGV4dCwgaGFuZGxlciwgYm91bmRBcmdzLi4uXSA9IGhhbmRsZXJcbiAgICBpZiB0eXBlb2YgaGFuZGxlciBpcyAnc3RyaW5nJ1xuICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgZWxzZVxuICAgIGJvdW5kQXJncyA9IFtdXG4gIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBwYXlsb2FkXG4gIHJldHVyblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVtaXR0ZXJcbiAgX2NhbGxiYWNrczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfY2FsbGJhY2tzID0ge31cblxuICBsaXN0ZW46IChbc2lnbmFsXS4uLiwgY2FsbGJhY2spIC0+XG4gICAgc2lnbmFsID89IERFRkFVTFRfU0lHTkFMXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXSA/PSBbXVxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0ucHVzaCBjYWxsYmFja1xuICAgIHRoaXNcblxuICBzdG9wTGlzdGVuaW5nOiAoW3NpZ25hbF0uLi4sIGNhbGxiYWNrKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIGlmIEBfY2FsbGJhY2tzW3NpZ25hbF0/XG4gICAgICBpZiBjYWxsYmFjaz9cbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICMgQXJyYXktc3R5bGUgY2FsbGJhY2tzIG5lZWQgbm90IGJlIHRoZSBleGFjdCBzYW1lIG9iamVjdC5cbiAgICAgICAgICBpbmRleCA9IC0xXG4gICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkgaGFuZGxlclxuICAgICAgICAgICAgaWYgYXJyYXlzTWF0Y2ggY2FsbGJhY2ssIGhhbmRsZXJcbiAgICAgICAgICAgICAgaW5kZXggPSBpXG4gICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpbmRleCA9IEBfY2FsbGJhY2tzW3NpZ25hbF0ubGFzdEluZGV4T2YgY2FsbGJhY2tcbiAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgaW5kZXgsIDFcbiAgICAgIGVsc2VcbiAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIHRoaXNcblxuICBlbWl0OiAoc2lnbmFsLCBwYXlsb2FkLi4uKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIGlmIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgY2FsbEhhbmRsZXIgY2FsbGJhY2ssIHBheWxvYWRcbiAgICB0aGlzXG5cbiAgZGVzdHJveTogLT5cbiAgICBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAc3RvcExpc3RlbmluZyBzaWduYWwsIGNhbGxiYWNrXG4gICAgcmV0dXJuXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcvJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgX3R5cGVzOiBudWxsICMgVHlwZXMgdGhhdCBoYXZlIGJlZW4gZGVmaW5lZFxuXG4gIGNvbnN0cnVjdG9yOiAoQHJvb3QsIEBoZWFkZXJzID0ge30pIC0+XG4gICAgQF90eXBlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnQ3JlYXRlZCBhIG5ldyBKU09OLUFQSSBjbGllbnQgYXQnLCBAcm9vdFxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgZGF0YSwgYWRkaXRpb25hbEhlYWRlcnMsIGNhbGxiYWNrKSAtPlxuICAgIGhlYWRlcnMgPSBtZXJnZUludG8ge30sIERFRkFVTFRfVFlQRV9BTkRfQUNDRVBULCBAaGVhZGVycywgYWRkaXRpb25hbEhlYWRlcnNcbiAgICBtYWtlSFRUUFJlcXVlc3QgbWV0aG9kLCBAcm9vdCArIHVybCwgZGF0YSwgaGVhZGVyc1xuICAgICAgLnRoZW4gKHJlcXVlc3QpID0+XG4gICAgICAgIEBwcm9jZXNzUmVzcG9uc2VUbyByZXF1ZXN0LCBjYWxsYmFja1xuICAgICAgLmNhdGNoIChyZXF1ZXN0KSA9PlxuICAgICAgICBAcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbyByZXF1ZXN0XG5cbiAgZm9yIG1ldGhvZCBpbiBbJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnXSB0aGVuIGRvIChtZXRob2QpID0+XG4gICAgQDo6W21ldGhvZF0gPSAtPlxuICAgICAgQHJlcXVlc3QgbWV0aG9kLCBhcmd1bWVudHMuLi5cblxuICBwcm9jZXNzUmVzcG9uc2VUbzogKHJlcXVlc3QsIGNhbGxiYWNrKSAtPlxuICAgIHJlc3BvbnNlID0gdHJ5IEpTT04ucGFyc2UgcmVxdWVzdC5yZXNwb25zZVRleHRcbiAgICByZXNwb25zZSA/PSB7fVxuICAgIHByaW50LmxvZyAnUHJvY2Vzc2luZyByZXNwb25zZScsIHJlc3BvbnNlXG5cbiAgICBpZiAnbGlua3MnIG9mIHJlc3BvbnNlXG4gICAgICBAX2hhbmRsZUxpbmtzIHJlc3BvbnNlLmxpbmtzXG5cbiAgICBpZiAnbGlua2VkJyBvZiByZXNwb25zZVxuICAgICAgZm9yIHR5cGUsIGxpbmtlZCBvZiByZXNwb25zZS5saW5rZWRcbiAgICAgICAgbGlua2VkID0gW10uY29uY2F0IGxpbmtlZFxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIGxpbmtlZC5sZW5ndGgsICdsaW5rZWQnLCB0eXBlLCAncmVzb3VyY2UocyknXG4gICAgICAgIGZvciByZXNvdXJjZSBpbiBsaW5rZWRcbiAgICAgICAgICBAdHlwZSh0eXBlKS5hZGRFeGlzdGluZ1Jlc291cmNlIHJlc291cmNlXG5cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIGRhdGEgPSBbXS5jb25jYXQgcmVzcG9uc2UuZGF0YVxuICAgICAgcHJpbnQubG9nICdHb3QgYSB0b3AtbGV2ZWwgXCJkYXRhXCIgY29sbGVjdGlvbiBvZicsIGRhdGEubGVuZ3RoLCAncmVzb3VyY2UocyknXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IGZvciByZXNvdXJjZSBpbiBkYXRhXG4gICAgICAgIEB0eXBlKHJlc291cmNlLnR5cGUpLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcbiAgICBlbHNlXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IFtdXG4gICAgICBmb3IgdHlwZU5hbWUsIHJlc291cmNlcyBvZiByZXNwb25zZSB3aGVuIHR5cGVOYW1lIG5vdCBpbiBbJ21ldGEnLCAnbGlua3MnLCAnbGlua2VkJywgJ2RhdGEnXVxuICAgICAgICB0eXBlID0gQHR5cGUgdHlwZU5hbWVcbiAgICAgICAgcmVzb3VyY2VzID0gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCcsIHR5cGUsICdjb2xsZWN0aW9uIG9mJywgcmVzb3VyY2VzLmxlbmd0aCwgJ3Jlc291cmNlKHMpJ1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzXG4gICAgICAgICAgcHJpbWFyeVJlc3VsdHMucHVzaCB0eXBlLmFkZEV4aXN0aW5nUmVzb3VyY2UgcmVzb3VyY2VcblxuICAgIHByaW50LmluZm8gJ1ByaW1hcnkgcmVzb3VyY2VzOicsIHByaW1hcnlSZXN1bHRzXG4gICAgY2FsbGJhY2s/IHJlcXVlc3QsIHJlc3BvbnNlXG4gICAgUHJvbWlzZS5hbGwgcHJpbWFyeVJlc3VsdHNcblxuICBfaGFuZGxlTGlua3M6IChsaW5rcykgLT5cbiAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiBsaW5rc1xuICAgICAgW3R5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICBocmVmID0gbGlua1xuICAgICAgZWxzZVxuICAgICAgICB7aHJlZiwgdHlwZX0gPSBsaW5rXG4gICAgICBAX2hhbmRsZUxpbmsgdHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWYsIHR5cGVcblxuICBfaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHR5cGUgPSBAdHlwZSB0eXBlTmFtZVxuXG4gICAgdHlwZS5fbGlua3NbYXR0cmlidXRlTmFtZV0gPz0ge31cbiAgICBpZiBocmVmVGVtcGxhdGU/XG4gICAgICB0eXBlLl9saW5rc1thdHRyaWJ1dGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICB0eXBlLl9saW5rc1thdHRyaWJ1dGVOYW1lXS50eXBlID0gYXR0cmlidXRlVHlwZU5hbWVcblxuICB0eXBlOiAobmFtZSkgLT5cbiAgICBAX3R5cGVzW25hbWVdID89IG5ldyBUeXBlIG5hbWUsIHRoaXNcbiAgICBAX3R5cGVzW25hbWVdXG5cbiAgY3JlYXRlVHlwZTogLT5cbiAgICBjb25zb2xlLndhcm4gJ1VzZSBKU09OQVBJQ2xpZW50Ojp0eXBlLCBub3QgOjpjcmVhdGVUeXBlJywgYXJndW1lbnRzLi4uXG4gICAgQHR5cGUgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgUHJvbWlzZS5yZWplY3QgdHJ5XG4gICAgICBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0XG4gICAgY2F0Y2hcbiAgICAgIG5ldyBFcnJvciByZXF1ZXN0LnJlc3BvbnNlVGV4dCB8fCByZXF1ZXN0LnN0YXR1c1xuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbm1vZHVsZS5leHBvcnRzLlR5cGUgPSBUeXBlXG5tb2R1bGUuZXhwb3J0cy5SZXNvdXJjZSA9IFJlc291cmNlXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5cbiMgTWFrZSBhIHJhdywgbm9uLUFQSSBzcGVjaWZpYyBIVFRQIHJlcXVlc3QuXG5cbm1vZHVsZS5leHBvcnRzID0gKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBtb2RpZnkpIC0+XG4gIG5ldyBQcm9taXNlIChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgbWV0aG9kID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICBpZiBkYXRhPyBhbmQgbWV0aG9kIGlzICdHRVQnXG4gICAgICB1cmwgKz0gJz8nICsgKFtrZXksIHZhbHVlXS5qb2luICc9JyBmb3Iga2V5LCB2YWx1ZSBvZiBkYXRhKS5qb2luICcmJ1xuICAgICAgZGF0YSA9IG51bGxcblxuICAgIHByaW50LmluZm8gJ1JlcXVlc3RpbmcnLCBtZXRob2QsIHVybCwgZGF0YVxuXG4gICAgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuICAgIHJlcXVlc3Qub3BlbiBtZXRob2QsIGVuY29kZVVSSSB1cmxcblxuICAgIHJlcXVlc3Qud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIGlmIG1vZGlmeT9cbiAgICAgIG1vZGlmeSByZXF1ZXN0XG5cbiAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IChlKSAtPlxuICAgICAgcHJpbnQubG9nICdSZWFkeSBzdGF0ZTonLCAoa2V5IGZvciBrZXksIHZhbHVlIG9mIHJlcXVlc3Qgd2hlbiB2YWx1ZSBpcyByZXF1ZXN0LnJlYWR5U3RhdGUgYW5kIGtleSBpc250ICdyZWFkeVN0YXRlJylbMF1cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgcHJpbnQubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICBpZiBoZWFkZXJzP1snQ29udGVudC1UeXBlJ10uaW5kZXhPZignanNvbicpIGlzbnQgLTFcbiAgICAgIGRhdGEgPSBKU09OLnN0cmluZ2lmeSBkYXRhXG5cbiAgICByZXF1ZXN0LnNlbmQgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsInByaW50ID0gKGxldmVsLCBjb2xvciwgbWVzc2FnZXMuLi4pIC0+XG4gICMgU2V0IHRoZSBsb2cgbGV2ZWwgd2l0aCBhIGdsb2JhbCB2YXJpYWJsZSBvciBhIHF1ZXJ5IHBhcmFtIGluIHRoZSBwYWdlJ3MgVVJMLlxuICBzZXR0aW5nID0gSlNPTl9BUElfTE9HX0xFVkVMID8gcGFyc2VGbG9hdCBsb2NhdGlvbj8uc2VhcmNoLm1hdGNoKC9qc29uLWFwaS1sb2c9KFxcZCspLyk/WzFdID8gMFxuXG4gIGlmIHNldHRpbmcgPj0gbGV2ZWxcbiAgICAjIFdlIGNhbiBzdHlsZSB0ZXh0IGluIHRoZSBicm93c2VyIGNvbnNvbGUsIGJ1dCBub3QgYXMgZWFzaWx5IGluIE5vZGUuXG4gICAgcHJlZml4ID0gaWYgbG9jYXRpb24/XG4gICAgICBbJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCJdXG4gICAgZWxzZVxuICAgICAgWyd7anNvbjphcGl9J11cblxuICAgIGNvbnNvbGU/LmxvZyBwcmVmaXguLi4sIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsIDQsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsIDMsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsIDIsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsIDEsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBfdHlwZTogbnVsbCAjIFRoZSByZXNvdXJjZSB0eXBlIG9iamVjdFxuXG4gIF9yZWFkT25seUtleXM6IFsnaWQnLCAndHlwZScsICdocmVmJywgJ2NyZWF0ZWRfYXQnLCAndXBkYXRlZF9hdCddXG5cbiAgX2NoYW5nZWRLZXlzOiBudWxsICMgRGlydHkga2V5c1xuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgQF9jaGFuZ2VkS2V5cyA9IFtdXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLlxuICAgIEBlbWl0ICdjcmVhdGUnXG4gICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcbiAgICBwcmludC5pbmZvIFwiQ29uc3RydWN0ZWQgYSByZXNvdXJjZTogI3tAX3R5cGUuX25hbWV9ICN7QGlkfVwiLCB0aGlzXG5cbiAgIyBHZXQgYSBwcm9taXNlIGZvciBhbiBhdHRyaWJ1dGUgcmVmZXJyaW5nIHRvIChhbilvdGhlciByZXNvdXJjZShzKS5cbiAgbGluazogKGF0dHJpYnV0ZSkgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nIGxpbms6JywgYXR0cmlidXRlXG4gICAgaWYgYXR0cmlidXRlIG9mIHRoaXNcbiAgICAgIHByaW50Lndhcm4gXCJObyBuZWVkIHRvIGFjY2VzcyBhIG5vbi1saW5rZWQgYXR0cmlidXRlIHZpYSBhdHRyOiAje2F0dHJpYnV0ZX1cIiwgdGhpc1xuICAgICAgUHJvbWlzZS5yZXNvbHZlIEBbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgQGxpbmtzPyBhbmQgYXR0cmlidXRlIG9mIEBsaW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHJlc291cmNlJ1xuICAgICAgQF9nZXRMaW5rIGF0dHJpYnV0ZSwgQGxpbmtzW2F0dHJpYnV0ZV1cbiAgICBlbHNlIGlmIGF0dHJpYnV0ZSBvZiBAX3R5cGUuX2xpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgdHlwZSdcbiAgICAgIEBfZ2V0TGluayBhdHRyaWJ1dGUsIEBfdHlwZS5fbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUuX25hbWV9IHJlc291cmNlXCJcblxuICBhdHRyOiAtPlxuICAgIGNvbnNvbGUud2FybiAnVXNlIFJlc291cmNlOjpsaW5rLCBub3QgOjphdHRyJywgYXJndW1lbnRzLi4uXG4gICAgQGxpbmsgYXJndW1lbnRzLi4uXG5cbiAgX2dldExpbms6IChuYW1lLCBsaW5rKSAtPlxuICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnIG9yIEFycmF5LmlzQXJyYXkgbGlua1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgSUQocyknXG4gICAgICBpZHMgPSBsaW5rXG4gICAgICB7aHJlZiwgdHlwZX0gPSBAX3R5cGUuX2xpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5fbmFtZV0gPSB0aGlzXG4gICAgICAgIGFwcGxpZWRIUkVGID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5fYXBpQ2xpZW50LmdldChhcHBsaWVkSFJFRikudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIGlmIHR5cGVvZiBAbGlua3M/W25hbWVdIGlzICdzdHJpbmcnXG4gICAgICAgICAgICByZXNvdXJjZXNbMF1cbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXNvdXJjZXNcblxuICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICB0eXBlID0gQF90eXBlLl9hcGlDbGllbnQuX3R5cGVzW3R5cGVdXG4gICAgICAgIHR5cGUuZ2V0IGlkc1xuXG4gICAgZWxzZSBpZiBsaW5rP1xuICAgICAgcHJpbnQubG9nICdMaW5rZWQgYnkgY29sbGVjdGlvbiBvYmplY3QnLCBsaW5rXG4gICAgICAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBjb250ZXh0ID0ge31cbiAgICAgICAgY29udGV4dFtAX3R5cGUuX25hbWVdID0gdGhpc1xuICAgICAgICBwcmludC53YXJuICdIUkVGJywgaHJlZlxuICAgICAgICBhcHBsaWVkSFJFRiA9IEBhcHBseUhSRUYgaHJlZiwgY29udGV4dFxuICAgICAgICBAX3R5cGUuX2FwaUNsaWVudC5nZXQoYXBwbGllZEhSRUYpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBpZiB0eXBlb2YgQGxpbmtzP1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT8gYW5kIGlkcz9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5fYXBpQ2xpZW50Ll90eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnTGlua2VkLCBidXQgYmxhbmsnXG4gICAgICAjIEl0IGV4aXN0cywgYnV0IGl0J3MgYmxhbmsuXG4gICAgICBQcm9taXNlLnJlc29sdmUgbnVsbFxuXG4gICMgVHVybiBhIEpTT04tQVBJIFwiaHJlZlwiIHRlbXBsYXRlIGludG8gYSB1c2FibGUgVVJMLlxuICBQTEFDRUhPTERFUlNfUEFUVEVSTjogL3soLis/KX0vZ1xuICBhcHBseUhSRUY6IChocmVmLCBjb250ZXh0KSAtPlxuICAgIGhyZWYucmVwbGFjZSBAUExBQ0VIT0xERVJTX1BBVFRFUk4sIChfLCBwYXRoKSAtPlxuICAgICAgc2VnbWVudHMgPSBwYXRoLnNwbGl0ICcuJ1xuICAgICAgcHJpbnQud2FybiAnU2VnbWVudHMnLCBzZWdtZW50c1xuXG4gICAgICB2YWx1ZSA9IGNvbnRleHRcbiAgICAgIHVudGlsIHNlZ21lbnRzLmxlbmd0aCBpcyAwXG4gICAgICAgIHNlZ21lbnQgPSBzZWdtZW50cy5zaGlmdCgpXG4gICAgICAgIHZhbHVlID0gdmFsdWVbc2VnbWVudF0gPyB2YWx1ZS5saW5rcz9bc2VnbWVudF1cblxuICAgICAgcHJpbnQud2FybiAnVmFsdWUnLCB2YWx1ZVxuXG4gICAgICBpZiBBcnJheS5pc0FycmF5IHZhbHVlXG4gICAgICAgIHZhbHVlID0gdmFsdWUuam9pbiAnLCdcblxuICAgICAgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJWYWx1ZSBmb3IgJyN7cGF0aH0nIGluICcje2hyZWZ9JyBzaG91bGQgYmUgYSBzdHJpbmcuXCJcblxuICAgICAgdmFsdWVcblxuICB1cGRhdGU6IChjaGFuZ2VTZXQgPSB7fSkgLT5cbiAgICBAZW1pdCAnd2lsbC1jaGFuZ2UnXG4gICAgYWN0dWFsQ2hhbmdlcyA9IDBcblxuICAgIGZvciBrZXksIHZhbHVlIG9mIGNoYW5nZVNldCB3aGVuIEBba2V5XSBpc250IHZhbHVlXG4gICAgICBAW2tleV0gPSB2YWx1ZVxuICAgICAgdW5sZXNzIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICAgIEBfY2hhbmdlZEtleXMucHVzaCBrZXlcbiAgICAgIGFjdHVhbENoYW5nZXMgKz0gMVxuXG4gICAgdW5sZXNzIGFjdHVhbENoYW5nZXMgaXMgMFxuICAgICAgQGVtaXQgJ2NoYW5nZSdcbiAgICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuXG4gICAgcGF5bG9hZCA9IHt9XG4gICAgcGF5bG9hZFtAX3R5cGUuX25hbWVdID0gQGdldENoYW5nZXNTaW5jZVNhdmUoKVxuXG4gICAgc2F2ZSA9IGlmIEBpZFxuICAgICAgQF90eXBlLl9hcGlDbGllbnQucHV0IEBnZXRVUkwoKSwgcGF5bG9hZFxuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5fYXBpQ2xpZW50LnBvc3QgQF90eXBlLl9nZXRVUkwoKSwgcGF5bG9hZFxuXG4gICAgc2F2ZS50aGVuIChbcmVzdWx0XSkgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0XG4gICAgICBAX2NoYW5nZWRLZXlzLnNwbGljZSAwXG4gICAgICBAZW1pdCAnc2F2ZSdcbiAgICAgIHJlc3VsdFxuXG4gIHJlZnJlc2g6IC0+XG4gICAgaWYgQGlkXG4gICAgICBAX3R5cGUuZ2V0IEBpZFxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciAnQ2FuXFwndCByZWZyZXNoIGEgcmVzb3VyY2Ugd2l0aCBubyBJRCdcblxuICBnZXRDaGFuZ2VzU2luY2VTYXZlOiAtPlxuICAgIGNoYW5nZXMgPSB7fVxuICAgIGZvciBrZXkgaW4gQF9jaGFuZ2VkS2V5c1xuICAgICAgY2hhbmdlc1trZXldID0gQFtrZXldXG4gICAgY2hhbmdlc1xuXG4gIGRlbGV0ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1kZWxldGUnXG4gICAgZGVsZXRpb24gPSBpZiBAaWRcbiAgICAgIEBfdHlwZS5fYXBpQ2xpZW50LmRlbGV0ZShAZ2V0VVJMKCkpLnRoZW4gPT5cbiAgICAgICAgQF90eXBlLmVtaXQgJ2NoYW5nZSdcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIGdldFVSTDogLT5cbiAgICBAaHJlZiB8fCBAX3R5cGUuX2dldFVSTCBAaWRcblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHRbQF90eXBlLl9uYW1lXSA9IHt9XG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIHRoaXMgd2hlbiBrZXkuY2hhckF0KDApIGlzbnQgJ18nIGFuZCBrZXkgbm90IGluIEBfcmVhZE9ubHlLZXlzXG4gICAgICByZXN1bHRbQF90eXBlLl9uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbmRlZmVyID0gLT5cbiAgZGVmZXJyYWwgPSB7fVxuICBkZWZlcnJhbC5wcm9taXNlID0gbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICBkZWZlcnJhbC5yZXNvbHZlID0gcmVzb2x2ZVxuICAgIGRlZmVycmFsLnJlamVjdCA9IHJlamVjdFxuICBkZWZlcnJhbFxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGUgZXh0ZW5kcyBFbWl0dGVyXG4gIF9uYW1lOiAnJ1xuICBfYXBpQ2xpZW50OiBudWxsXG5cbiAgX2xpbmtzOiBudWxsICMgUmVzb3VyY2UgbGluayBkZWZpbml0aW9uc1xuXG4gIF9kZWZlcnJhbHM6IG51bGwgIyBLZXlzIGFyZSBJRHMgb2Ygc3BlY2lmaWNhbGx5IHJlcXVlc3RlZCByZXNvdXJjZXMuXG4gIF9yZXNvdXJjZVByb21pc2VzOiBudWxsICMgS2V5cyBhcmUgSURzLCB2YWx1ZXMgYXJlIHByb21pc2VzIHJlc29sdmluZyB0byByZXNvdXJjZXMuXG5cbiAgY29uc3RydWN0b3I6IChAX25hbWUsIEBfYXBpQ2xpZW50KSAtPlxuICAgIHN1cGVyXG4gICAgQF9saW5rcyA9IHt9XG4gICAgQF9kZWZlcnJhbHMgPSB7fVxuICAgIEBfcmVzb3VyY2VQcm9taXNlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5lZCBhIG5ldyB0eXBlOicsIEBfbmFtZVxuXG4gIF9nZXRVUkw6IC0+XG4gICAgW251bGwsIEBfbmFtZSwgYXJndW1lbnRzLi4uXS5qb2luICcvJ1xuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBleGlzdExvY2FsbHkgPSAocHJvbWlzZSBmb3IgaWQsIHByb21pc2Ugb2YgQF9yZXNvdXJjZVByb21pc2VzIHdoZW4gbm90IEB3YWl0aW5nRm9yIGlkKVxuICAgIFByb21pc2UuYWxsKGV4aXN0TG9jYWxseSkudGhlbiAocmVzb3VyY2VzKSAtPlxuICAgICAgcmVzb3VyY2UgZm9yIHJlc291cmNlIGluIHJlc291cmNlcyB3aGVuIHJlc291cmNlLm1hdGNoZXNRdWVyeSBxdWVyeVxuXG4gIHdhaXRpbmdGb3I6IChpZCkgLT5cbiAgICBAX2RlZmVycmFsc1tpZF0/XG5cbiAgaGFzOiAoaWQpIC0+XG4gICAgQF9yZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAX2RlZmVycmFsc1tpZF0/XG5cbiAgZ2V0OiAtPlxuICAgIGlmIHR5cGVvZiBhcmd1bWVudHNbMF0gaXMgJ3N0cmluZydcbiAgICAgIEBnZXRCeUlEIGFyZ3VtZW50cy4uLlxuICAgIGVsc2UgaWYgQXJyYXkuaXNBcnJheSBhcmd1bWVudHNbMF1cbiAgICAgIEBnZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAZ2V0QnlRdWVyeSBhcmd1bWVudHMuLi5cblxuICBnZXRCeUlEOiAoaWQsIG90aGVyQXJncy4uLikgLT5cbiAgICBAZ2V0QnlJRHMoW2lkXSwgb3RoZXJBcmdzLi4uKS50aGVuIChbcmVzb3VyY2VdKSAtPlxuICAgICAgcmVzb3VyY2VcblxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgcHJpbnQuaW5mbyAnR2V0dGluZycsIEBfbmFtZSwgJ2J5IElEKHMpJywgaWRzXG4gICAgZm9yIGlkIGluIGlkc1xuICAgICAgQF9kZWZlcnJhbHNbaWRdID0gZGVmZXIoKVxuICAgICAgQF9yZXNvdXJjZVByb21pc2VzW2lkXSA9IEBfZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICB1cmwgPSBbQF9nZXRVUkwoKSwgaWRzLmpvaW4gJywnXS5qb2luICcvJ1xuICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAX25hbWUsICdhdCcsIHVybFxuICAgIEBfYXBpQ2xpZW50LmdldCB1cmwsIG9wdGlvbnMsIG51bGwsIGNhbGxiYWNrXG5cbiAgICBQcm9taXNlLmFsbCAoQF9yZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSwgY2FsbGJhY2spIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIGV4aXN0aW5nSURzID0gKGlkIGZvciB7aWR9IGluIGV4aXN0aW5nKVxuICAgICAgICBwYXJhbXMgPSB7fVxuICAgICAgICBpZiBpc0Zpbml0ZSBsaW1pdFxuICAgICAgICAgIHBhcmFtcy5saW1pdCA9IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5XG5cbiAgICAgICAgQF9hcGlDbGllbnQuZ2V0KEBfZ2V0VVJMKCksIHBhcmFtcywgbnVsbCwgY2FsbGJhY2spLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgICAgICBmZXRjaGVkID0gKHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZS5pZCBub3QgaW4gZXhpc3RpbmdJRHMpXG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IGZldGNoZWRcblxuICBhZGRFeGlzdGluZ1Jlc291cmNlOiAoZGF0YSkgLT5cbiAgICBpZiBAd2FpdGluZ0ZvciBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ0RvbmUgd2FpdGluZyBmb3InLCBAX25hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIG5ld1Jlc291cmNlID0gbmV3IFJlc291cmNlIF90eXBlOiB0aGlzLCBkYXRhXG4gICAgICBkZWZlcnJhbCA9IEBfZGVmZXJyYWxzW2RhdGEuaWRdXG4gICAgICBAX2RlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICAgIGRlZmVycmFsLnJlc29sdmUgbmV3UmVzb3VyY2VcblxuICAgIGVsc2UgaWYgQGhhcyBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1RoZScsIEBfbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2FscmVhZHkgZXhpc3RzOyB3aWxsIHVwZGF0ZSdcbiAgICAgIEBnZXQoZGF0YS5pZCkudGhlbiAocmVzb3VyY2UpIC0+XG4gICAgICAgIHJlc291cmNlLnVwZGF0ZSBkYXRhXG5cbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0FjY2VwdGluZycsIEBfbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZFxuICAgICAgbmV3UmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXMsIGRhdGFcbiAgICAgIEBfcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXSA9IFByb21pc2UucmVzb2x2ZSBuZXdSZXNvdXJjZVxuXG4gICAgQF9yZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgY3JlYXRlOiAoZGF0YSkgLT5cbiAgICBwcmludC5sb2cgJ0NyZWF0aW5nIGEgbmV3JywgQF9uYW1lLCAncmVzb3VyY2UnXG4gICAgcmVzb3VyY2UgPSBuZXcgUmVzb3VyY2UgX3R5cGU6IHRoaXNcbiAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIHJlc291cmNlXG5cbiAgY3JlYXRlUmVzb3VyY2U6IC0+XG4gICAgY29uc29sZS53YXJuICdVc2UgVHlwZTo6Y3JlYXRlLCBub3QgOjpjcmVhdGVSZXNvdXJjZScsIGFyZ3VtZW50cy4uLlxuICAgIEBjcmVhdGUgYXJndW1lbnRzLi4uXG4iXX0=

