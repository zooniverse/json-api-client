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
    this.emit('destroy');
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
var DEFAULT_TYPE_AND_ACCEPT, Emitter, JSONAPIClient, Model, RESERVED_TOP_LEVEL_KEYS, Resource, Type, makeHTTPRequest, mergeInto,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

makeHTTPRequest = _dereq_('./make-http-request');

mergeInto = _dereq_('./merge-into');

Emitter = _dereq_('./emitter');

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
    return makeHTTPRequest(method, fullURL, payload, allHeaders).then(this.processResponse.bind(this))["catch"](this.handleError.bind(this));
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

  JSONAPIClient.prototype.processResponse = function(request) {
    var headers, linkedResources, resourceData, resources, response, results, typeName, _j, _k, _l, _len1, _len2, _len3, _ref1, _ref2, _ref3, _ref4;
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
      for (typeName in _ref1) {
        linkedResources = _ref1[typeName];
        _ref2 = [].concat(linkedResources);
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          resourceData = _ref2[_j];
          this.type(typeName).create(resourceData, headers, response.meta);
        }
      }
    }
    results = [];
    if ('data' in response) {
      _ref3 = [].concat(response.data);
      for (_k = 0, _len2 = _ref3.length; _k < _len2; _k++) {
        resourceData = _ref3[_k];
        results.push(this.type(resourceData.type).create(resourceData, headers, response.meta));
      }
    } else {
      for (typeName in response) {
        resources = response[typeName];
        if (__indexOf.call(RESERVED_TOP_LEVEL_KEYS, typeName) < 0) {
          _ref4 = [].concat(resources);
          for (_l = 0, _len3 = _ref4.length; _l < _len3; _l++) {
            resourceData = _ref4[_l];
            results.push(this.type(typeName).create(resourceData, headers, response.meta));
          }
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

  JSONAPIClient.prototype.handleError = function() {
    return Promise.reject.apply(Promise, arguments);
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

  return JSONAPIClient;

})();

module.exports.util = {
  makeHTTPRequest: makeHTTPRequest
};

module.exports.Emitter = Emitter;

module.exports.Type = Type;

module.exports.Model = Model;

module.exports.Resource = Resource;



},{"./emitter":1,"./make-http-request":3,"./merge-into":4,"./model":5,"./resource":6,"./type":7}],3:[function(_dereq_,module,exports){
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
    if ((data != null) && (headers != null ? (_ref = headers['Content-Type']) != null ? _ref.indexOf('json') : void 0 : void 0) !== -1) {
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
    var base, key, lastKey, path, rootKey, value, _i, _len, _ref;
    if (changeSet == null) {
      changeSet = {};
    }
    if (typeof changeSet === 'string') {
      console.warn('You can now update dotted-path keys, so you probably don\'t need to call Resource::update on strings anymore.');
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        key = arguments[_i];
        if (__indexOf.call(this._changedKeys, key) < 0) {
          (_ref = this._changedKeys).push.apply(_ref, arguments);
        }
      }
    } else {
      for (key in changeSet) {
        if (!__hasProp.call(changeSet, key)) continue;
        value = changeSet[key];
        path = key.split('.');
        rootKey = path[0];
        base = this;
        while (path.length !== 1) {
          base = base[path.shift()];
        }
        lastKey = path.shift();
        if (value === void 0) {
          delete base[lastKey];
        } else if (typeof value === 'function') {
          value.call(base[lastKey]);
        } else {
          base[key] = value;
        }
        if (__indexOf.call(this._changedKeys, rootKey) < 0) {
          this._changedKeys.push(rootKey);
        }
      }
    }
    this.emit('change');
    return this;
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

  Resource.prototype._ignoredKeys = Model.prototype._ignoredKeys.concat(['id', 'type', 'href']);

  Resource.prototype._type = null;

  Resource.prototype._headers = null;

  Resource.prototype._meta = null;

  Resource.prototype._linksCache = null;

  function Resource(_type) {
    this._type = _type;
    if (this._type == null) {
      throw new Error('Don\'t call the Resource constructor directly, use `client.type("things").create({});`');
    }
    Resource.__super__.constructor.call(this, null);
    this._linksCache = {};
    this._type.emit('change');
    this.emit('create');
  }

  Resource.prototype.getRequestMeta = function(key) {
    return this._meta[key != null ? key : this._type._name];
  };

  Resource.prototype.update = function() {
    var value;
    value = Resource.__super__.update.apply(this, arguments);
    if (this.id && this._type._cache[this.id] !== this) {
      this._type._cache[this.id] = this;
      this._type.emit('change');
    }
    return value;
  };

  Resource.prototype.save = function() {
    var headers, payload, save;
    payload = {};
    payload[this._type._name] = this.getChangesSinceSave();
    save = this.id ? (headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client.put(this._getURL(), payload, headers)) : this._type._client.post(this._type._getURL(), payload);
    return save.then((function(_this) {
      return function(_arg) {
        var result;
        result = _arg[0];
        if (result !== _this) {
          _this.update(result);
          _this._changedKeys.splice(0);
          result.destroy();
        }
        _this.emit('save');
        return _this;
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

  Resource.prototype.refresh = function() {
    if (this.id) {
      return this._type.get(this.id, {});
    } else {
      throw new Error('Can\'t refresh a resource with no ID');
    }
  };

  Resource.prototype.uncache = function() {
    if (this.id) {
      this.emit('uncache');
      return delete this._type._cache[this.id];
    } else {
      throw new Error('Can\'t uncache a resource with no ID');
    }
  };

  Resource.prototype["delete"] = function() {
    var deletion, headers;
    deletion = this.id ? (this.uncache(), headers = {}, 'Last-Modified' in this._headers ? headers['If-Unmodified-Since'] = this._headers['Last-Modified'] : void 0, this._type._client["delete"](this._getURL(), null, headers)) : Promise.resolve();
    return deletion.then((function(_this) {
      return function() {
        _this.emit('delete');
        _this._type.emit('change');
        _this.destroy();
        return null;
      };
    })(this));
  };

  Resource.prototype.get = function(name, _arg) {
    var link, skipCache, _ref;
    skipCache = (_arg != null ? _arg : {}).skipCache;
    if ((this._linksCache[name] != null) && !skipCache) {
      return this._linksCache[name];
    } else {
      link = (_ref = this.links) != null ? _ref[name] : void 0;
      this._linksCache[name] = (function() {
        if (typeof link === 'string' || Array.isArray(link)) {
          return this._getLinkByIDs(name, link);
        } else if (link != null) {
          return this._getLinkByObject(name, link);
        } else {
          throw new Error("No link '" + name + "' defined for " + this._type._name + "#" + this.id);
        }
      }).call(this);
      return this._linksCache[name];
    }
  };

  Resource.prototype._getLinkByIDs = function(name, idOrIDs) {
    var href, type, _ref, _ref1;
    if (this._type._links[name] != null) {
      _ref = this._type._links[name], type = _ref.type, href = _ref.href;
      if (type != null) {
        return this._type._client.type(type).get(idOrIDs);
      } else if (href != null) {
        return this._type._client.get(this._applyHREF(href)).then(function(resources) {
          if (typeof idOrIDs === 'string') {
            return resources[0];
          } else {
            return resources;
          }
        });
      } else {
        throw new Error("No type or href for link '" + name + "' of " + this._type._name + "#" + ((_ref1 = this.id) != null ? _ref1 : '?'));
      }
    } else {
      throw new Error("No link '" + name + "' for " + this._type._name);
    }
  };

  Resource.prototype._getLinkByObject = function(name, _arg) {
    var href, id, ids, type, _ref;
    id = _arg.id, ids = _arg.ids, type = _arg.type, href = _arg.href;
    if (((id != null) || (ids != null)) && (type != null)) {
      return this._type._client.type(type).get(id != null ? id : ids);
    } else if (href != null) {
      return this._type._client.get(this._applyHREF(href));
    } else {
      throw new Error("No type and ID(s) or href for link '" + name + "' of " + this._type._name + "#" + ((_ref = this.id) != null ? _ref : '?'));
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

  Resource.prototype.link = function() {
    console.warn.apply(console, ['Use Resource::get, not ::link'].concat(__slice.call(arguments)));
    return this.get.apply(this, arguments);
  };

  return Resource;

})(Model);



},{"./merge-into":4,"./model":5}],7:[function(_dereq_,module,exports){
var Emitter, Resource, Type,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Emitter = _dereq_('./emitter');

Resource = _dereq_('./resource');

module.exports = Type = (function(_super) {
  __extends(Type, _super);

  Type.prototype.Resource = Resource;

  Type.prototype._name = '';

  Type.prototype._client = null;

  Type.prototype._links = null;

  Type.prototype._cache = null;

  function Type(_name, _client) {
    this._name = _name;
    this._client = _client;
    Type.__super__.constructor.apply(this, arguments);
    this._links = {};
    this._cache = {};
    if (!(this._name && (this._client != null))) {
      throw new Error('Don\'t call the Type constructor directly, use `client.type("things");`');
    }
  }

  Type.prototype.create = function(data, headers, meta) {
    var resource, _ref, _ref1;
    if (data == null) {
      data = {};
    }
    if (headers == null) {
      headers = {};
    }
    if (meta == null) {
      meta = {};
    }
    if (data.type && data.type !== this._name) {
      return (_ref = this._client.type(data.type)).create.apply(_ref, arguments);
    } else {
      resource = (_ref1 = this._cache[data.id]) != null ? _ref1 : new this.Resource(this);
      resource._headers = headers;
      resource._meta = meta;
      resource.update(data);
      if (resource === this._cache[data.id]) {
        resource._changedKeys.splice(0);
      }
      return resource;
    }
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
    var fetch, id, ids, inCache, otherArgs, toFetch, url, _ref;
    ids = arguments[0], otherArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    inCache = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (id in this._cache && otherArgs.length === 0) {
          _results.push(id);
        }
      }
      return _results;
    }).call(this);
    toFetch = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = ids.length; _i < _len; _i++) {
        id = ids[_i];
        if (__indexOf.call(inCache, id) < 0) {
          _results.push(id);
        }
      }
      return _results;
    })();
    fetch = toFetch.length === 0 ? Promise.resolve([]) : (url = this._getURL(toFetch.join(',')), (_ref = this._client).get.apply(_ref, [url].concat(__slice.call(otherArgs))));
    return fetch.then((function(_this) {
      return function(fetched) {
        var fetchedByID, resource, _i, _j, _len, _len1, _ref1, _results;
        fetchedByID = {};
        for (_i = 0, _len = fetched.length; _i < _len; _i++) {
          resource = fetched[_i];
          fetchedByID[resource.id] = resource;
        }
        _results = [];
        for (_j = 0, _len1 = ids.length; _j < _len1; _j++) {
          id = ids[_j];
          _results.push((_ref1 = fetchedByID[id]) != null ? _ref1 : _this._cache[id]);
        }
        return _results;
      };
    })(this));
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
