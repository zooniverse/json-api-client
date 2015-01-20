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
var DEFAULT_TYPE_AND_ACCEPT, JSONAPIClient, Model, RESERVED_TOP_LEVEL_KEYS, Resource, Type, makeHTTPRequest, mergeInto,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Type = _dereq_('./type');

Model = _dereq_('./model');

Resource = _dereq_('./resource');

DEFAULT_TYPE_AND_ACCEPT = {
  'Content-Type': 'application/vnd.api+json',
  'Accept': 'application/vnd.api+json'
};

RESERVED_TOP_LEVEL_KEYS = ['meta', 'links', 'linked', 'data'];

module.exports = JSONAPIClient = (function() {
  var method, _fn, _i, _len, _ref;

  JSONAPIClient.prototype.root = '/';

  JSONAPIClient.prototype.headers = null;

  JSONAPIClient.prototype._types = null;

  function JSONAPIClient(root, headers) {
    this.root = root;
    this.headers = headers != null ? headers : {};
    this._types = {};
  }

  JSONAPIClient.prototype.request = function(method, url, payload, headers) {
    var allHeaders, fullURL;
    fullURL = this.root + url;
    allHeaders = mergeInto({}, DEFAULT_TYPE_AND_ACCEPT, this.headers, headers);
    return makeHTTPRequest(method, fullURL, payload, allHeaders).then(this.processResponseTo.bind(this))["catch"](this.processErrorResponseTo.bind(this));
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

  JSONAPIClient.prototype.processResponseTo = function(request) {
    var headers, linked, resourceData, resources, response, results, type, typeName, _j, _k, _l, _len1, _len2, _len3, _ref1, _ref2, _ref3, _ref4;
    response = (function() {
      try {
        return JSON.parse(request.responseText);
      } catch (_error) {
        return {};
      }
    })();
    headers = this._getHeadersFor(request);
    if ('links' in response) {
      this._handleLinks(response.links);
    }
    if ('linked' in response) {
      _ref1 = response.linked;
      for (type in _ref1) {
        linked = _ref1[type];
        _ref2 = [].concat(linked);
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          resourceData = _ref2[_j];
          this.type(type).create(resourceData, headers);
        }
      }
    }
    results = [];
    if ('data' in response) {
      _ref3 = [].concat(response.data);
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        resourceData = _ref3[_k];
        results.push(this.type(resourceData.type).create(resourceData, headers));
      }
    }
    for (typeName in response) {
      resources = response[typeName];
      if (__indexOf.call(RESERVED_TOP_LEVEL_KEYS, typeName) < 0) {
        _ref4 = [].concat(resources);
        for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
          resourceData = _ref4[_l];
          results.push(this.type(typeName).create(resourceData, headers));
        }
      }
    }
    return results;
  };

  JSONAPIClient.prototype._getHeadersFor = function(request) {
    var headers, key, pair, value, _j, _len1, _ref1, _ref2;
    headers = {};
    _ref1 = request.getAllResponseHeaders().split('\n');
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      pair = _ref1[_j];
      if (!(pair !== '')) {
        continue;
      }
      _ref2 = pair.split(':'), key = _ref2[0], value = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
      headers[key.trim()] = value.join(':').trim();
    }
    return headers;
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

  JSONAPIClient.prototype.processErrorResponseTo = function(request) {
    return Promise.reject(request);
  };

  JSONAPIClient.prototype.createType = function() {
    console.warn.apply(console, ['Use JSONAPIClient::type, not ::createType'].concat(__slice.call(arguments)));
    return this.type.apply(this, arguments);
  };

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};

module.exports.Type = Type;

module.exports.Model = Model;

module.exports.Resource = Resource;



},{"./make-http-request":3,"./merge-into":4,"./model":5,"./resource":6,"./type":7}],3:[function(_dereq_,module,exports){
module.exports = function(method, url, data, headers, modify) {
  return new Promise(function(resolve, reject) {
    var header, key, request, value, _ref;
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
      if (request.readyState === request.DONE) {
        if ((200 <= (_ref = request.status) && _ref < 300)) {
          return resolve(request);
        } else {
          return reject(request);
        }
      }
    };
    if ((headers != null ? (_ref = headers['Content-Type']) != null ? _ref.indexOf('json') : void 0 : void 0) !== -1) {
      data = JSON.stringify(data);
    }
    return request.send(data);
  });
};



},{}],4:[function(_dereq_,module,exports){
var __hasProp = {}.hasOwnProperty;

module.exports = function() {
  var argument, key, value, _i, _len, _ref;
  _ref = Array.prototype.slice.call(arguments, 1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    argument = _ref[_i];
    if (argument != null) {
      for (key in argument) {
        if (!__hasProp.call(argument, key)) continue;
        value = argument[key];
        arguments[0][key] = value;
      }
    }
  }
  return arguments[0];
};



},{}],5:[function(_dereq_,module,exports){
var Emitter, Model, mergeInto,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

module.exports = Model = (function(_super) {
  __extends(Model, _super);

  Model.prototype._ignoredKeys = [];

  Model.prototype._changedKeys = null;

  function Model() {
    var configs;
    configs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Model.__super__.constructor.apply(this, arguments);
    this._changedKeys = [];
    mergeInto.apply(null, [this].concat(__slice.call(configs)));
    this.emit('create');
  }

  Model.prototype.update = function(changeSet) {
    var key, value;
    if (changeSet == null) {
      changeSet = {};
    }
    this.emit('will-change');
    for (key in changeSet) {
      value = changeSet[key];
      if (!(this[key] !== value)) {
        continue;
      }
      if (typeof value === 'function') {
        value = value();
      }
      this[key] = value;
      if (__indexOf.call(this._changedKeys, key) < 0) {
        this._changedKeys.push(key);
      }
    }
    return this.emit('change');
  };

  Model.prototype.hasUnsavedChanges = function() {
    return this._changedKeys.length !== 0;
  };

  Model.prototype.toJSON = function() {
    var key, result, value;
    result = {};
    for (key in this) {
      if (!__hasProp.call(this, key)) continue;
      value = this[key];
      if (key.charAt(0) !== '_' && __indexOf.call(this._ignoredKeys, key) < 0) {
        result[key] = value;
      }
    }
    return result;
  };

  return Model;

})(Emitter);



},{"./emitter":1,"./merge-into":4}],6:[function(_dereq_,module,exports){
var Model, PLACEHOLDERS_PATTERN, Resource, mergeInto,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Model = _dereq_('./model');

mergeInto = _dereq_('./merge-into');

PLACEHOLDERS_PATTERN = /{(.+?)}/g;

module.exports = Resource = (function(_super) {
  __extends(Resource, _super);

  Resource.prototype._ignoredKeys = Model.prototype._ignoredKeys.concat(['id', 'type', 'href', 'created_at', 'updated_at']);

  Resource.prototype._type = null;

  Resource.prototype._headers = null;

  function Resource() {
    var configs;
    configs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    this._type.emit('change');
  }

  Resource.prototype.update = function() {
    Resource.__super__.update.apply(this, arguments);
    return this._type.emit('change');
  };

  Resource.prototype.save = function() {
    var headers, payload, save;
    this.emit('will-save');
    payload = {};
    payload[this._type._name] = this.getChangesSinceSave();
    save = this.id ? (headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client.put(this._getURL(), payload, headers)) : this._type._client.post(this._type._getURL(), payload);
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

  Resource.prototype.getFresh = function() {
    if (this.id) {
      return this._type.get(this.id);
    } else {
      return Promise.reject(new Error('Can\'t get fresh copy of a resource with no ID'));
    }
  };

  Resource.prototype["delete"] = function() {
    var deletion, headers;
    this.emit('will-delete');
    deletion = this.id ? (headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client["delete"](this._getURL(), null, headers).then((function(_this) {
      return function() {
        _this._type.emit('change');
        return null;
      };
    })(this))) : Promise.resolve();
    return deletion.then((function(_this) {
      return function() {
        return _this.emit('delete');
      };
    })(this));
  };

  Resource.prototype.link = function(name) {
    var link, _ref, _ref1;
    link = (_ref = (_ref1 = this.links) != null ? _ref1[name] : void 0) != null ? _ref : this._type._links[name];
    if (link != null) {
      return this._getLink(name, link);
    } else {
      throw new Error("No link '" + name + "' defined for " + this._type.name + " " + this.id);
    }
  };

  Resource.prototype._getLink = function(name, link) {
    var href, ids, type, _ref;
    if (typeof link === 'string' || Array.isArray(link)) {
      _ref = this._type._links[name], href = _ref.href, type = _ref.type;
      if (href != null) {
        return this._type._client.get(this._applyHREF(href)).then((function(_this) {
          return function(resources) {
            if (typeof _this.links[name] === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
      } else if (type != null) {
        type = this._type._client._types[type];
        return type.get(link);
      } else {
        throw new Error("No HREF or type for link '" + name + "' of " + this._type.name + " " + this.id);
      }
    } else {
      href = link.href, ids = link.ids, type = link.type;
      if (href != null) {
        return this._type._client.get(this._applyHREF(href)).then((function(_this) {
          return function(resources) {
            if (typeof _this.links[name] === 'string') {
              return resources[0];
            } else {
              return resources;
            }
          };
        })(this));
      } else if ((type != null) && (ids != null)) {
        type = this._type._client._types[type];
        return type.get(ids);
      } else {
        throw new Error("No HREF, type, or IDs for link '" + name + "' of " + this._type.name + " " + this.id);
      }
    }
  };

  Resource.prototype._applyHREF = function(href) {
    var context;
    context = {};
    context[this._type._name] = this;
    return href.replace(PLACEHOLDERS_PATTERN, function(_, path) {
      var segment, segments, value, _ref, _ref1;
      segments = path.split('.');
      value = context;
      while (segments.length !== 0) {
        segment = segments.shift();
        value = (_ref = value[segment]) != null ? _ref : (_ref1 = value.links) != null ? _ref1[segment] : void 0;
      }
      if (Array.isArray(value)) {
        value = value.join(',');
      }
      if (typeof value !== 'string') {
        throw new Error("Value for '" + path + "' in '" + href + "' should be a string.");
      }
      return value;
    });
  };

  Resource.prototype._getURL = function() {
    var _ref;
    return this.href || (_ref = this._type)._getURL.apply(_ref, [this.id].concat(__slice.call(arguments)));
  };

  Resource.prototype.attr = function() {
    console.warn.apply(console, ['Use Resource::link, not ::attr'].concat(__slice.call(arguments)));
    return this.link.apply(this, arguments);
  };

  return Resource;

})(Model);



},{"./merge-into":4,"./model":5}],7:[function(_dereq_,module,exports){
var Emitter, Resource, Type,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Emitter = _dereq_('./emitter');

Resource = _dereq_('./resource');

module.exports = Type = (function(_super) {
  __extends(Type, _super);

  Type.prototype._name = '';

  Type.prototype._client = null;

  Type.prototype._links = null;

  function Type(_name, _client) {
    this._name = _name;
    this._client = _client;
    Type.__super__.constructor.apply(this, arguments);
    this._links = {};
  }

  Type.prototype.create = function(data, headers) {
    if (headers == null) {
      headers = {};
    }
    return new Resource(data, {
      _type: this,
      _headers: headers
    });
  };

  Type.prototype.get = function() {
    if (typeof arguments[0] === 'string') {
      return this._getByID.apply(this, arguments);
    } else if (Array.isArray(arguments[0])) {
      return this._getByIDs.apply(this, arguments);
    } else {
      return this._getByQuery.apply(this, arguments);
    }
  };

  Type.prototype._getByID = function() {
    var id, otherArgs;
    id = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return this._getByIDs.apply(this, [[id]].concat(__slice.call(otherArgs))).then(function(_arg) {
      var resource;
      resource = _arg[0];
      return resource;
    });
  };

  Type.prototype._getByIDs = function() {
    var ids, otherArgs, url, _ref;
    ids = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    url = this._getURL(ids.join(','));
    return (_ref = this._client).get.apply(_ref, [url].concat(__slice.call(otherArgs)));
  };

  Type.prototype._getByQuery = function() {
    var otherArgs, query, _ref;
    query = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this._client).get.apply(_ref, [this._getURL(), query].concat(__slice.call(otherArgs)));
  };

  Type.prototype._getURL = function() {
    return ['', this._name].concat(__slice.call(arguments)).join('/');
  };

  Type.prototype.createResource = function() {
    console.warn.apply(console, ['Use Type::create, not ::createResource'].concat(__slice.call(arguments)));
    return this.create.apply(this, arguments);
  };

  return Type;

})(Emitter);



},{"./emitter":1,"./resource":6}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL21vZGVsLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxpREFBQTtFQUFBLGtCQUFBOztBQUFBLGNBQUEsR0FBaUIsUUFBakIsQ0FBQTs7QUFBQSxXQUVBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVCxHQUFBO0FBQ1osTUFBQSxzQkFBQTtBQUFBLEVBQUEsT0FBQTs7QUFBVztTQUFBLHFEQUFBO3VCQUFBO1VBQTZCLE1BQU8sQ0FBQSxDQUFBLENBQVAsS0FBYTtBQUExQyxzQkFBQSxFQUFBO09BQUE7QUFBQTs7TUFBWCxDQUFBO1NBQ0EsQ0FBQSxNQUFNLENBQUMsTUFBUCxhQUFpQixNQUFNLENBQUMsT0FBeEIsUUFBQSxLQUFrQyxPQUFPLENBQUMsTUFBMUMsRUFGWTtBQUFBLENBRmQsQ0FB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WSxLQUFPLFNBQUEsYUFBQSxTQUFBLENBQUEsQ0FBaEMsRUFEVztFQUFBLENBNUJiLENBQUE7O0FBQUEsaUJBK0JBLE9BQUEsR0FBUyxTQUFBLEdBQUE7V0FDTixDQUFBLEVBQUEsRUFBSSxJQUFDLENBQUEsS0FBTyxTQUFBLGFBQUEsU0FBQSxDQUFBLENBQWEsQ0FBQyxJQUEzQixDQUFnQyxHQUFoQyxFQURPO0VBQUEsQ0EvQlQsQ0FBQTs7QUFBQSxpQkFrQ0EsY0FBQSxHQUFnQixTQUFBLEdBQUE7QUFDZCxJQUFBLE9BQU8sQ0FBQyxJQUFSLGdCQUFhLENBQUEsd0NBQTBDLFNBQUEsYUFBQSxTQUFBLENBQUEsQ0FBdkQsQ0FBQSxDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsYUFBUSxTQUFSLEVBRmM7RUFBQSxDQWxDaEIsQ0FBQTs7Y0FBQTs7R0FEa0MsUUFIcEMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJERUZBVUxUX1NJR05BTCA9ICdjaGFuZ2UnXG5cbmFycmF5c01hdGNoID0gKGFycmF5MSwgYXJyYXkyKSAtPlxuICBtYXRjaGVzID0gKGkgZm9yIGl0ZW0sIGkgaW4gYXJyYXkxIHdoZW4gYXJyYXkyW2ldIGlzIGl0ZW0pXG4gIGFycmF5MS5sZW5ndGggaXMgYXJyYXkyLmxlbmd0aCBpcyBtYXRjaGVzLmxlbmd0aFxuXG5jYWxsSGFuZGxlciA9IChoYW5kbGVyLCBwYXlsb2FkKSAtPlxuICAjIEhhbmRsZXJzIGNhbiBiZSBpbiB0aGUgZm9ybSBbY29udGV4dCwgZnVuY3Rpb24gb3IgbWV0aG9kIG5hbWUsIGJvdW5kIGFyZ3VtZW50cy4uLl1cbiAgaWYgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgW2NvbnRleHQsIGhhbmRsZXIsIGJvdW5kQXJncy4uLl0gPSBoYW5kbGVyXG4gICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgIGhhbmRsZXIgPSBjb250ZXh0W2hhbmRsZXJdXG4gIGVsc2VcbiAgICBib3VuZEFyZ3MgPSBbXVxuICBoYW5kbGVyLmFwcGx5IGNvbnRleHQsIGJvdW5kQXJncy5jb25jYXQgcGF5bG9hZFxuICByZXR1cm5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoW3NpZ25hbF0uLi4sIGNhbGxiYWNrKSAtPlxuICAgIHNpZ25hbCA/PSBERUZBVUxUX1NJR05BTFxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0gPz0gW11cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnB1c2ggY2FsbGJhY2tcbiAgICB0aGlzXG5cbiAgc3RvcExpc3RlbmluZzogKFtzaWduYWxdLi4uLCBjYWxsYmFjaykgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBAX2NhbGxiYWNrc1tzaWduYWxdP1xuICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkgY2FsbGJhY2tcbiAgICAgICAgICAjIEFycmF5LXN0eWxlIGNhbGxiYWNrcyBuZWVkIG5vdCBiZSB0aGUgZXhhY3Qgc2FtZSBvYmplY3QuXG4gICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgIGZvciBoYW5kbGVyLCBpIGluIEBfY2FsbGJhY2tzW3NpZ25hbF0gYnkgLTEgd2hlbiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgICAgICAgIGlmIGFycmF5c01hdGNoIGNhbGxiYWNrLCBoYW5kbGVyXG4gICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICBicmVha1xuICAgICAgICBlbHNlXG4gICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgIHVubGVzcyBpbmRleCBpcyAtMVxuICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIGluZGV4LCAxXG4gICAgICBlbHNlXG4gICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIDBcbiAgICB0aGlzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBzaWduYWwgPz0gREVGQVVMVF9TSUdOQUxcbiAgICBpZiBzaWduYWwgb2YgQF9jYWxsYmFja3NcbiAgICAgIGZvciBjYWxsYmFjayBpbiBAX2NhbGxiYWNrc1tzaWduYWxdXG4gICAgICAgIGNhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG4gICAgdGhpc1xuXG4gIGRlc3Ryb3k6IC0+XG4gICAgZm9yIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgQHN0b3BMaXN0ZW5pbmcgc2lnbmFsLCBjYWxsYmFja1xuICAgIHJldHVyblxuIiwibWFrZUhUVFBSZXF1ZXN0ID0gcmVxdWlyZSAnLi9tYWtlLWh0dHAtcmVxdWVzdCdcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblR5cGUgPSByZXF1aXJlICcuL3R5cGUnXG5Nb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbkRFRkFVTFRfVFlQRV9BTkRfQUNDRVBUID1cbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG4gICdBY2NlcHQnOiAnYXBwbGljYXRpb24vdm5kLmFwaStqc29uJ1xuXG5SRVNFUlZFRF9UT1BfTEVWRUxfS0VZUyA9IFsnbWV0YScsICdsaW5rcycsICdsaW5rZWQnLCAnZGF0YSddXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSlNPTkFQSUNsaWVudFxuICByb290OiAnLydcbiAgaGVhZGVyczogbnVsbFxuXG4gIF90eXBlczogbnVsbCAjIFR5cGVzIHRoYXQgaGF2ZSBiZWVuIGRlZmluZWRcblxuICBjb25zdHJ1Y3RvcjogKEByb290LCBAaGVhZGVycyA9IHt9KSAtPlxuICAgIEBfdHlwZXMgPSB7fVxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgcGF5bG9hZCwgaGVhZGVycykgLT5cbiAgICBmdWxsVVJMID0gQHJvb3QgKyB1cmxcbiAgICBhbGxIZWFkZXJzID0gbWVyZ2VJbnRvIHt9LCBERUZBVUxUX1RZUEVfQU5EX0FDQ0VQVCwgQGhlYWRlcnMsIGhlYWRlcnNcblxuICAgIG1ha2VIVFRQUmVxdWVzdCBtZXRob2QsIGZ1bGxVUkwsIHBheWxvYWQsIGFsbEhlYWRlcnNcbiAgICAgIC50aGVuIEBwcm9jZXNzUmVzcG9uc2VUby5iaW5kIHRoaXNcbiAgICAgIC5jYXRjaCBAcHJvY2Vzc0Vycm9yUmVzcG9uc2VUby5iaW5kIHRoaXNcblxuICBmb3IgbWV0aG9kIGluIFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZSddIHRoZW4gZG8gKG1ldGhvZCkgPT5cbiAgICBAOjpbbWV0aG9kXSA9IC0+XG4gICAgICBAcmVxdWVzdCBtZXRob2QsIGFyZ3VtZW50cy4uLlxuXG4gIHByb2Nlc3NSZXNwb25zZVRvOiAocmVxdWVzdCkgLT5cbiAgICByZXNwb25zZSA9IHRyeSBKU09OLnBhcnNlIHJlcXVlc3QucmVzcG9uc2VUZXh0IGNhdGNoIHRoZW4ge31cbiAgICBoZWFkZXJzID0gQF9nZXRIZWFkZXJzRm9yIHJlcXVlc3RcblxuICAgIGlmICdsaW5rcycgb2YgcmVzcG9uc2VcbiAgICAgIEBfaGFuZGxlTGlua3MgcmVzcG9uc2UubGlua3NcblxuICAgIGlmICdsaW5rZWQnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZSwgbGlua2VkIG9mIHJlc3BvbnNlLmxpbmtlZFxuICAgICAgICBmb3IgcmVzb3VyY2VEYXRhIGluIFtdLmNvbmNhdCBsaW5rZWRcbiAgICAgICAgICBAdHlwZSh0eXBlKS5jcmVhdGUgcmVzb3VyY2VEYXRhLCBoZWFkZXJzXG5cbiAgICByZXN1bHRzID0gW11cbiAgICBpZiAnZGF0YScgb2YgcmVzcG9uc2VcbiAgICAgIGZvciByZXNvdXJjZURhdGEgaW4gW10uY29uY2F0IHJlc3BvbnNlLmRhdGFcbiAgICAgICAgcmVzdWx0cy5wdXNoIEB0eXBlKHJlc291cmNlRGF0YS50eXBlKS5jcmVhdGUgcmVzb3VyY2VEYXRhLCBoZWFkZXJzXG4gICAgZm9yIHR5cGVOYW1lLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlTmFtZSBub3QgaW4gUkVTRVJWRURfVE9QX0xFVkVMX0tFWVNcbiAgICAgIGZvciByZXNvdXJjZURhdGEgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICByZXN1bHRzLnB1c2ggQHR5cGUodHlwZU5hbWUpLmNyZWF0ZSByZXNvdXJjZURhdGEsIGhlYWRlcnNcbiAgICByZXN1bHRzXG5cbiAgX2dldEhlYWRlcnNGb3I6IChyZXF1ZXN0KSAtPlxuICAgIGhlYWRlcnMgPSB7fVxuICAgIGZvciBwYWlyIGluIHJlcXVlc3QuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkuc3BsaXQgJ1xcbicgd2hlbiBwYWlyIGlzbnQgJydcbiAgICAgIFtrZXksIHZhbHVlLi4uXSA9IHBhaXIuc3BsaXQgJzonXG4gICAgICBoZWFkZXJzW2tleS50cmltKCldID0gdmFsdWUuam9pbignOicpLnRyaW0oKVxuICAgIGhlYWRlcnNcblxuICBfaGFuZGxlTGlua3M6IChsaW5rcykgLT5cbiAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiBsaW5rc1xuICAgICAgW3R5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJ1xuICAgICAgICBocmVmID0gbGlua1xuICAgICAgZWxzZVxuICAgICAgICB7aHJlZiwgdHlwZX0gPSBsaW5rXG4gICAgICBAX2hhbmRsZUxpbmsgdHlwZU5hbWUsIGF0dHJpYnV0ZU5hbWUsIGhyZWYsIHR5cGVcblxuICBfaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHR5cGUgPSBAdHlwZSB0eXBlTmFtZVxuXG4gICAgdHlwZS5fbGlua3NbYXR0cmlidXRlTmFtZV0gPz0ge31cbiAgICBpZiBocmVmVGVtcGxhdGU/XG4gICAgICB0eXBlLl9saW5rc1thdHRyaWJ1dGVOYW1lXS5ocmVmID0gaHJlZlRlbXBsYXRlXG4gICAgaWYgYXR0cmlidXRlVHlwZU5hbWU/XG4gICAgICB0eXBlLl9saW5rc1thdHRyaWJ1dGVOYW1lXS50eXBlID0gYXR0cmlidXRlVHlwZU5hbWVcblxuICB0eXBlOiAobmFtZSkgLT5cbiAgICBAX3R5cGVzW25hbWVdID89IG5ldyBUeXBlIG5hbWUsIHRoaXNcbiAgICBAX3R5cGVzW25hbWVdXG5cbiAgcHJvY2Vzc0Vycm9yUmVzcG9uc2VUbzogKHJlcXVlc3QpIC0+XG4gICAgUHJvbWlzZS5yZWplY3QgcmVxdWVzdFxuXG4gIGNyZWF0ZVR5cGU6IC0+XG4gICAgY29uc29sZS53YXJuICdVc2UgSlNPTkFQSUNsaWVudDo6dHlwZSwgbm90IDo6Y3JlYXRlVHlwZScsIGFyZ3VtZW50cy4uLlxuICAgIEB0eXBlIGFyZ3VtZW50cy4uLlxuXG5tb2R1bGUuZXhwb3J0cy51dGlsID0ge21ha2VIVFRQUmVxdWVzdH1cbm1vZHVsZS5leHBvcnRzLlR5cGUgPSBUeXBlXG5tb2R1bGUuZXhwb3J0cy5Nb2RlbCA9IE1vZGVsXG5tb2R1bGUuZXhwb3J0cy5SZXNvdXJjZSA9IFJlc291cmNlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIG1ldGhvZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG5cbiAgICBpZiBkYXRhPyBhbmQgbWV0aG9kIGlzICdHRVQnXG4gICAgICB1cmwgKz0gJz8nICsgKFtrZXksIHZhbHVlXS5qb2luICc9JyBmb3Iga2V5LCB2YWx1ZSBvZiBkYXRhKS5qb2luICcmJ1xuICAgICAgZGF0YSA9IG51bGxcblxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcbiAgICByZXF1ZXN0Lm9wZW4gbWV0aG9kLCBlbmNvZGVVUkkgdXJsXG5cbiAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWVcblxuICAgIGlmIGhlYWRlcnM/XG4gICAgICBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBoZWFkZXJzXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlciBoZWFkZXIsIHZhbHVlXG5cbiAgICBpZiBtb2RpZnk/XG4gICAgICBtb2RpZnkgcmVxdWVzdFxuXG4gICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoZSkgLT5cbiAgICAgIGlmIHJlcXVlc3QucmVhZHlTdGF0ZSBpcyByZXF1ZXN0LkRPTkVcbiAgICAgICAgaWYgMjAwIDw9IHJlcXVlc3Quc3RhdHVzIDwgMzAwXG4gICAgICAgICAgcmVzb2x2ZSByZXF1ZXN0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZWplY3QgcmVxdWVzdFxuXG4gICAgdW5sZXNzIGhlYWRlcnM/WydDb250ZW50LVR5cGUnXT8uaW5kZXhPZignanNvbicpIGlzIC0xXG4gICAgICBkYXRhID0gSlNPTi5zdHJpbmdpZnkgZGF0YVxuXG4gICAgcmVxdWVzdC5zZW5kIGRhdGFcbiIsIm1vZHVsZS5leHBvcnRzID0gLT5cbiAgZm9yIGFyZ3VtZW50IGluIEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50cywgMSB3aGVuIGFyZ3VtZW50P1xuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsIkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgTW9kZWwgZXh0ZW5kcyBFbWl0dGVyXG4gIF9pZ25vcmVkS2V5czogW11cbiAgX2NoYW5nZWRLZXlzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChjb25maWdzLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgQF9jaGFuZ2VkS2V5cyA9IFtdXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZ3MuLi5cbiAgICBAZW1pdCAnY3JlYXRlJ1xuXG4gIHVwZGF0ZTogKGNoYW5nZVNldCA9IHt9KSAtPlxuICAgIEBlbWl0ICd3aWxsLWNoYW5nZSdcbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBjaGFuZ2VTZXQgd2hlbiBAW2tleV0gaXNudCB2YWx1ZVxuICAgICAgaWYgdHlwZW9mIHZhbHVlIGlzICdmdW5jdGlvbidcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSgpXG4gICAgICBAW2tleV0gPSB2YWx1ZVxuICAgICAgdW5sZXNzIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICAgIEBfY2hhbmdlZEtleXMucHVzaCBrZXlcbiAgICBAZW1pdCAnY2hhbmdlJ1xuXG4gIGhhc1Vuc2F2ZWRDaGFuZ2VzOiAtPlxuICAgIEBfY2hhbmdlZEtleXMubGVuZ3RoIGlzbnQgMFxuXG4gIHRvSlNPTjogLT5cbiAgICByZXN1bHQgPSB7fVxuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5LmNoYXJBdCgwKSBpc250ICdfJyBhbmQga2V5IG5vdCBpbiBAX2lnbm9yZWRLZXlzXG4gICAgICByZXN1bHRba2V5XSA9IHZhbHVlXG4gICAgcmVzdWx0XG4iLCJNb2RlbCA9IHJlcXVpcmUgJy4vbW9kZWwnXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5cbiMgVHVybiBhIEpTT04tQVBJIFwiaHJlZlwiIHRlbXBsYXRlIGludG8gYSB1c2FibGUgVVJMLlxuUExBQ0VIT0xERVJTX1BBVFRFUk4gPSAveyguKz8pfS9nXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgUmVzb3VyY2UgZXh0ZW5kcyBNb2RlbFxuICBfaWdub3JlZEtleXM6IE1vZGVsOjpfaWdub3JlZEtleXMuY29uY2F0IFsnaWQnLCAndHlwZScsICdocmVmJywgJ2NyZWF0ZWRfYXQnLCAndXBkYXRlZF9hdCddXG5cbiAgX3R5cGU6IG51bGxcbiAgX2hlYWRlcnM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKGNvbmZpZ3MuLi4pIC0+XG4gICAgc3VwZXJcbiAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuXG4gIHVwZGF0ZTogLT5cbiAgICBzdXBlclxuICAgIEBfdHlwZS5lbWl0ICdjaGFuZ2UnXG5cbiAgc2F2ZTogLT5cbiAgICBAZW1pdCAnd2lsbC1zYXZlJ1xuXG4gICAgcGF5bG9hZCA9IHt9XG4gICAgcGF5bG9hZFtAX3R5cGUuX25hbWVdID0gQGdldENoYW5nZXNTaW5jZVNhdmUoKVxuXG4gICAgc2F2ZSA9IGlmIEBpZFxuICAgICAgaGVhZGVycyA9IHt9XG4gICAgICBpZiAnTGFzdC1Nb2RpZmllZCcgb2YgQF9oZWFkZXJzXG4gICAgICAgIGhlYWRlcnNbJ0lmLVVubW9kaWZpZWQtU2luY2UnXSA9IEBfaGVhZGVyc1snTGFzdC1Nb2RpZmllZCddXG4gICAgICBAX3R5cGUuX2NsaWVudC5wdXQgQF9nZXRVUkwoKSwgcGF5bG9hZCwgaGVhZGVyc1xuICAgIGVsc2VcbiAgICAgIEBfdHlwZS5fY2xpZW50LnBvc3QgQF90eXBlLl9nZXRVUkwoKSwgcGF5bG9hZFxuXG4gICAgc2F2ZS50aGVuIChbcmVzdWx0XSkgPT5cbiAgICAgIEB1cGRhdGUgcmVzdWx0XG4gICAgICBAX2NoYW5nZWRLZXlzLnNwbGljZSAwXG4gICAgICBAZW1pdCAnc2F2ZSdcbiAgICAgIHJlc3VsdFxuXG4gIGdldENoYW5nZXNTaW5jZVNhdmU6IC0+XG4gICAgY2hhbmdlcyA9IHt9XG4gICAgZm9yIGtleSBpbiBAX2NoYW5nZWRLZXlzXG4gICAgICBjaGFuZ2VzW2tleV0gPSBAW2tleV1cbiAgICBjaGFuZ2VzXG5cbiAgZ2V0RnJlc2g6IC0+XG4gICAgaWYgQGlkXG4gICAgICBAX3R5cGUuZ2V0IEBpZFxuICAgIGVsc2VcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciAnQ2FuXFwndCBnZXQgZnJlc2ggY29weSBvZiBhIHJlc291cmNlIHdpdGggbm8gSUQnXG5cbiAgZGVsZXRlOiAtPlxuICAgIEBlbWl0ICd3aWxsLWRlbGV0ZSdcbiAgICBkZWxldGlvbiA9IGlmIEBpZFxuICAgICAgaGVhZGVycyA9IHt9XG4gICAgICBpZiAnTGFzdC1Nb2RpZmllZCcgb2YgQF9oZWFkZXJzXG4gICAgICAgIGhlYWRlcnNbJ0lmLVVubW9kaWZpZWQtU2luY2UnXSA9IEBfaGVhZGVyc1snTGFzdC1Nb2RpZmllZCddXG4gICAgICBAX3R5cGUuX2NsaWVudC5kZWxldGUoQF9nZXRVUkwoKSwgbnVsbCwgaGVhZGVycykudGhlbiA9PlxuICAgICAgICBAX3R5cGUuZW1pdCAnY2hhbmdlJ1xuICAgICAgICBudWxsXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGRlbGV0aW9uLnRoZW4gPT5cbiAgICAgIEBlbWl0ICdkZWxldGUnXG5cbiAgbGluazogKG5hbWUpIC0+XG4gICAgbGluayA9IEBsaW5rcz9bbmFtZV0gPyBAX3R5cGUuX2xpbmtzW25hbWVdXG4gICAgaWYgbGluaz9cbiAgICAgIEBfZ2V0TGluayBuYW1lLCBsaW5rXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiTm8gbGluayAnI3tuYW1lfScgZGVmaW5lZCBmb3IgI3tAX3R5cGUubmFtZX0gI3tAaWR9XCJcblxuICBfZ2V0TGluazogKG5hbWUsIGxpbmspIC0+XG4gICAgaWYgdHlwZW9mIGxpbmsgaXMgJ3N0cmluZycgb3IgQXJyYXkuaXNBcnJheSBsaW5rXG4gICAgICB7aHJlZiwgdHlwZX0gPSBAX3R5cGUuX2xpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIEBfdHlwZS5fY2xpZW50LmdldChAX2FwcGx5SFJFRiBocmVmKS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgaWYgdHlwZW9mIEBsaW5rc1tuYW1lXSBpcyAnc3RyaW5nJ1xuICAgICAgICAgICAgcmVzb3VyY2VzWzBdXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb3VyY2VzXG5cbiAgICAgIGVsc2UgaWYgdHlwZT9cbiAgICAgICAgdHlwZSA9IEBfdHlwZS5fY2xpZW50Ll90eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBsaW5rXG5cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiTm8gSFJFRiBvciB0eXBlIGZvciBsaW5rICcje25hbWV9JyBvZiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIlxuXG4gICAgZWxzZSAjIEl0J3MgYSBjb2xsZWN0aW9uIG9iamVjdC5cbiAgICAgIHtocmVmLCBpZHMsIHR5cGV9ID0gbGlua1xuXG4gICAgICBpZiBocmVmP1xuICAgICAgICBAX3R5cGUuX2NsaWVudC5nZXQoQF9hcHBseUhSRUYgaHJlZikudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICAgIGlmIHR5cGVvZiBAbGlua3NbbmFtZV0gaXMgJ3N0cmluZydcbiAgICAgICAgICAgIHJlc291cmNlc1swXVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc291cmNlc1xuXG4gICAgICBlbHNlIGlmIHR5cGU/IGFuZCBpZHM/XG4gICAgICAgIHR5cGUgPSBAX3R5cGUuX2NsaWVudC5fdHlwZXNbdHlwZV1cbiAgICAgICAgdHlwZS5nZXQgaWRzXG5cbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiTm8gSFJFRiwgdHlwZSwgb3IgSURzIGZvciBsaW5rICcje25hbWV9JyBvZiAje0BfdHlwZS5uYW1lfSAje0BpZH1cIlxuXG4gIF9hcHBseUhSRUY6IChocmVmKSAtPlxuICAgIGNvbnRleHQgPSB7fVxuICAgIGNvbnRleHRbQF90eXBlLl9uYW1lXSA9IHRoaXNcblxuICAgIGhyZWYucmVwbGFjZSBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBpZiBBcnJheS5pc0FycmF5IHZhbHVlXG4gICAgICAgIHZhbHVlID0gdmFsdWUuam9pbiAnLCdcblxuICAgICAgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJWYWx1ZSBmb3IgJyN7cGF0aH0nIGluICcje2hyZWZ9JyBzaG91bGQgYmUgYSBzdHJpbmcuXCJcblxuICAgICAgdmFsdWVcblxuICBfZ2V0VVJMOiAtPlxuICAgIEBocmVmIHx8IEBfdHlwZS5fZ2V0VVJMIEBpZCwgYXJndW1lbnRzLi4uXG5cbiAgYXR0cjogLT5cbiAgICBjb25zb2xlLndhcm4gJ1VzZSBSZXNvdXJjZTo6bGluaywgbm90IDo6YXR0cicsIGFyZ3VtZW50cy4uLlxuICAgIEBsaW5rIGFyZ3VtZW50cy4uLlxuIiwiRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBUeXBlIGV4dGVuZHMgRW1pdHRlclxuICBfbmFtZTogJydcbiAgX2NsaWVudDogbnVsbFxuXG4gIF9saW5rczogbnVsbCAjIFJlc291cmNlIGxpbmsgZGVmaW5pdGlvbnNcblxuICBjb25zdHJ1Y3RvcjogKEBfbmFtZSwgQF9jbGllbnQpIC0+XG4gICAgc3VwZXJcbiAgICBAX2xpbmtzID0ge31cblxuICBjcmVhdGU6IChkYXRhLCBoZWFkZXJzID0ge30pIC0+XG4gICAgbmV3IFJlc291cmNlIGRhdGEsIF90eXBlOiB0aGlzLCBfaGVhZGVyczogaGVhZGVyc1xuXG4gIGdldDogLT5cbiAgICBpZiB0eXBlb2YgYXJndW1lbnRzWzBdIGlzICdzdHJpbmcnXG4gICAgICBAX2dldEJ5SUQgYXJndW1lbnRzLi4uXG4gICAgZWxzZSBpZiBBcnJheS5pc0FycmF5IGFyZ3VtZW50c1swXVxuICAgICAgQF9nZXRCeUlEcyBhcmd1bWVudHMuLi5cbiAgICBlbHNlXG4gICAgICBAX2dldEJ5UXVlcnkgYXJndW1lbnRzLi4uXG5cbiAgX2dldEJ5SUQ6IChpZCwgb3RoZXJBcmdzLi4uKSAtPlxuICAgIEBfZ2V0QnlJRHMoW2lkXSwgb3RoZXJBcmdzLi4uKS50aGVuIChbcmVzb3VyY2VdKSAtPlxuICAgICAgcmVzb3VyY2VcblxuICBfZ2V0QnlJRHM6IChpZHMsIG90aGVyQXJncy4uLikgLT5cbiAgICB1cmwgPSBAX2dldFVSTCBpZHMuam9pbiAnLCdcbiAgICBAX2NsaWVudC5nZXQgdXJsLCBvdGhlckFyZ3MuLi5cblxuICBfZ2V0QnlRdWVyeTogKHF1ZXJ5LCBvdGhlckFyZ3MuLi4pIC0+XG4gICAgQF9jbGllbnQuZ2V0IEBfZ2V0VVJMKCksIHF1ZXJ5LCBvdGhlckFyZ3MuLi5cblxuICBfZ2V0VVJMOiAtPlxuICAgIFsnJywgQF9uYW1lLCBhcmd1bWVudHMuLi5dLmpvaW4gJy8nXG5cbiAgY3JlYXRlUmVzb3VyY2U6IC0+XG4gICAgY29uc29sZS53YXJuICdVc2UgVHlwZTo6Y3JlYXRlLCBub3QgOjpjcmVhdGVSZXNvdXJjZScsIGFyZ3VtZW50cy4uLlxuICAgIEBjcmVhdGUgYXJndW1lbnRzLi4uXG4iXX0=

