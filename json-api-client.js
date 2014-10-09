!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.JSONAPIClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var Emitter,
  __slice = [].slice;

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
    if (typeof console !== "undefined" && console !== null) {
      console.log('Emitting', signal, JSON.stringify(payload), (_ref = this._callbacks[signal]) != null ? _ref.length : void 0);
    }
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



},{}],2:[function(_dereq_,module,exports){
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
    return primaryResults;
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
module.exports = function(method, url, data, headers, modify) {
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
      console.log('Ready state:', ((function() {
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
        console.log('Done; status is', request.status);
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



},{}],4:[function(_dereq_,module,exports){
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
  var color, messages;
  color = arguments[0], messages = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  return console.log.apply(console, ['%c{json:api}', "color: " + color + "; font: bold 1em monospace;"].concat(__slice.call(messages)));
};

module.exports = {
  log: print.bind(null, 'gray'),
  info: print.bind(null, 'blue'),
  warn: print.bind(null, 'orange'),
  error: print.bind(null, 'red')
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

  function Resource() {
    var config;
    config = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    Resource.__super__.constructor.apply(this, arguments);
    if (config != null) {
      mergeInto.apply(null, [this].concat(__slice.call(config)));
    }
    if (typeof console !== "undefined" && console !== null) {
      console.log("Created resource: " + this._type.name + " " + this.id, this);
    }
    this.emit('create');
    console.log('Created!');
  }

  Resource.prototype.attr = function(attribute) {
    print.info('Getting link:', attribute);
    if (attribute in this) {
      if (typeof console !== "undefined" && console !== null) {
        console.warn("No need to access a non-linked attribute via attr: " + attribute, this);
      }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9lbWl0dGVyLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2pzb24tYXBpLWNsaWVudC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tYWtlLWh0dHAtcmVxdWVzdC5jb2ZmZWUiLCIvVXNlcnMvYnJpYW4vRHJvcGJveC9QdWJsaWMvanNvbi1hcGktY2xpZW50L3NyYy9tZXJnZS1pbnRvLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3ByaW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3Jlc291cmNlLmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL3R5cGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxPQUFBO0VBQUEsa0JBQUE7O0FBQUEsTUFBTSxDQUFDLE9BQVAsR0FBdUI7QUFDckIsb0JBQUEsVUFBQSxHQUFZLElBQVosQ0FBQTs7QUFFYSxFQUFBLGlCQUFBLEdBQUE7QUFDWCxJQUFBLElBQUMsQ0FBQSxVQUFELEdBQWMsRUFBZCxDQURXO0VBQUEsQ0FGYjs7QUFBQSxvQkFLQSxNQUFBLEdBQVEsU0FBQyxNQUFELEVBQVMsUUFBVCxHQUFBO0FBQ04sUUFBQSxLQUFBOztXQUFZLENBQUEsTUFBQSxJQUFXO0tBQXZCO1dBQ0EsSUFBQyxDQUFBLFVBQVcsQ0FBQSxNQUFBLENBQU8sQ0FBQyxJQUFwQixDQUF5QixRQUF6QixFQUZNO0VB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QixDQUFBLElBQUksQ0FBQyxFQUFMLEVBYko7RUFBQSxDQXhFaEIsQ0FBQTs7QUFBQSxpQkF1RkEsdUJBQUEsR0FBeUIsU0FBQyxRQUFELEVBQVcsTUFBWCxFQUFtQixPQUFuQixHQUFBO1dBQ3ZCLElBQUMsQ0FBQSxJQUFELENBQU0sUUFBTixFQUR1QjtFQUFBLENBdkZ6QixDQUFBOztjQUFBOztHQURrQyxRQVpwQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW1pdHRlclxuICBfY2FsbGJhY2tzOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQF9jYWxsYmFja3MgPSB7fVxuXG4gIGxpc3RlbjogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXSA/PSBbXVxuICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0ucHVzaCBjYWxsYmFja1xuXG4gIHN0b3BMaXN0ZW5pbmc6IChzaWduYWwsIGNhbGxiYWNrKSAtPlxuICAgIGlmIHNpZ25hbD9cbiAgICAgIGlmIEBfY2FsbGJhY2tzW3NpZ25hbF0/XG4gICAgICAgIGlmIGNhbGxiYWNrP1xuICAgICAgICAgIGlmIEFycmF5LmlzQXJyYXkgY2FsbGJhY2tcbiAgICAgICAgICAgICMgQXJyYXktc3R5bGUgY2FsbGJhY2tzIG5lZWQgbm90IGJlIHRoZSBleGFjdCBzYW1lIG9iamVjdC5cbiAgICAgICAgICAgIGluZGV4ID0gLTFcbiAgICAgICAgICAgIGZvciBoYW5kbGVyLCBpIGluIEBfY2FsbGJhY2tzW3NpZ25hbF0gYnkgLTEgd2hlbiBBcnJheS5pc0FycmF5KGhhbmRsZXIpIGFuZCBjYWxsYmFjay5sZW5ndGggaXMgaGFuZGxlci5sZW5ndGhcbiAgICAgICAgICAgICAgaWYgKG51bGwgZm9yIGl0ZW0sIGogaW4gY2FsbGJhY2sgd2hlbiBoYW5kbGVyW2pdIGlzIGl0ZW0pLmxlbmd0aCBpcyBjYWxsYmFjay5sZW5ndGhcbiAgICAgICAgICAgICAgICBpbmRleCA9IGlcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGV4ID0gQF9jYWxsYmFja3Nbc2lnbmFsXS5sYXN0SW5kZXhPZiBjYWxsYmFja1xuICAgICAgICAgIHVubGVzcyBpbmRleCBpcyAtMVxuICAgICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgaW5kZXgsIDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEBfY2FsbGJhY2tzW3NpZ25hbF0uc3BsaWNlIDBcbiAgICBlbHNlXG4gICAgICBAc3RvcExpc3RlbmluZyBzaWduYWwgZm9yIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQuLi4pIC0+XG4gICAgY29uc29sZT8ubG9nICdFbWl0dGluZycsIHNpZ25hbCwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksIEBfY2FsbGJhY2tzW3NpZ25hbF0/Lmxlbmd0aFxuICAgIGlmIHNpZ25hbCBvZiBAX2NhbGxiYWNrc1xuICAgICAgZm9yIGNhbGxiYWNrIGluIEBfY2FsbGJhY2tzW3NpZ25hbF1cbiAgICAgICAgQF9jYWxsSGFuZGxlciBjYWxsYmFjaywgcGF5bG9hZFxuXG4gIF9jYWxsSGFuZGxlcjogKGhhbmRsZXIsIGFyZ3MpIC0+XG4gICAgaWYgQXJyYXkuaXNBcnJheSBoYW5kbGVyXG4gICAgICBbY29udGV4dCwgaGFuZGxlciwgYm91bmRBcmdzLi4uXSA9IGhhbmRsZXJcbiAgICAgIGlmIHR5cGVvZiBoYW5kbGVyIGlzICdzdHJpbmcnXG4gICAgICAgIGhhbmRsZXIgPSBjb250ZXh0W2hhbmRsZXJdXG4gICAgZWxzZVxuICAgICAgYm91bmRBcmdzID0gW11cbiAgICBoYW5kbGVyLmFwcGx5IGNvbnRleHQsIGJvdW5kQXJncy5jb25jYXQgYXJnc1xuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xubWFrZUhUVFBSZXF1ZXN0ID0gcmVxdWlyZSAnLi9tYWtlLWh0dHAtcmVxdWVzdCdcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblR5cGUgPSByZXF1aXJlICcuL3R5cGUnXG5cbkRFRkFVTFRfVFlQRV9BTkRfQUNDRVBUID1cbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi92bmQuYXBpK2pzb24nXG4gICdBY2NlcHQnOiBcImFwcGxpY2F0aW9uL3ZuZC5hcGkranNvblwiXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSlNPTkFQSUNsaWVudFxuICByb290OiAnJ1xuICBoZWFkZXJzOiBudWxsXG5cbiAgdHlwZXM6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEByb290LCBAaGVhZGVycykgLT5cbiAgICBAaGVhZGVycyA/PSB7fVxuICAgIEB0eXBlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnQ3JlYXRlZCBhIG5ldyBKU09OLUFQSSBjbGllbnQgYXQnLCBAcm9vdFxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgZGF0YSwgYWRkaXRpb25hbEhlYWRlcnMpIC0+XG4gICAgcHJpbnQuaW5mbyAnTWFraW5nIGEnLCBtZXRob2QsICdyZXF1ZXN0IHRvJywgdXJsXG4gICAgaGVhZGVycyA9IG1lcmdlSW50byB7fSwgREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQsIEBoZWFkZXJzLCBhZGRpdGlvbmFsSGVhZGVyc1xuICAgIG1ha2VIVFRQUmVxdWVzdChtZXRob2QsIEByb290ICsgdXJsLCBkYXRhLCBoZWFkZXJzKS50aGVuIEBwcm9jZXNzUmVzcG9uc2VUby5iaW5kIHRoaXNcblxuICBmb3IgbWV0aG9kIGluIFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZSddIHRoZW4gZG8gKG1ldGhvZCkgPT5cbiAgICBAOjpbbWV0aG9kXSA9IC0+XG4gICAgICBAcmVxdWVzdCBtZXRob2QudG9VcHBlckNhc2UoKSwgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIHByaW50LmxvZyAnUHJvY2Vzc2luZyByZXNwb25zZScsIHJlc3BvbnNlXG5cbiAgICBpZiAnbWV0YScgb2YgcmVzcG9uc2VcbiAgICAgICdUT0RPOiBObyBpZGVhIHlldCEnXG5cbiAgICBpZiAnbGlua3MnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiByZXNwb25zZS5saW5rc1xuICAgICAgICBbdHlwZSwgYXR0cmlidXRlXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnXG4gICAgICAgICAgaHJlZiA9IGxpbmtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHtocmVmLCB0eXBlOiBhdHRyaWJ1dGVUeXBlfSA9IGxpbmtcblxuICAgICAgICBAaGFuZGxlTGluayB0eXBlLCBhdHRyaWJ1dGUsIGhyZWYsIGF0dHJpYnV0ZVR5cGVcblxuICAgIGlmICdsaW5rZWQnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlLmxpbmtlZFxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIHJlc291cmNlcyA/IDEsICdsaW5rZWQnLCB0eXBlLCAncmVzb3VyY2VzLidcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZSB1bmxlc3MgQHR5cGVzW3R5cGVdP1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZVxuXG4gICAgaWYgJ2RhdGEnIG9mIHJlc3BvbnNlXG4gICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCBcImRhdGFcIiBjb2xsZWN0aW9uIG9mJywgcmVzcG9uc2UuZGF0YS5sZW5ndGggPyAxXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzcG9uc2UuZGF0YVxuICAgICAgICBAY3JlYXRlVHlwZSByZXNwb25zZS50eXBlIHVubGVzcyBAdHlwZXNbcmVzb3VyY2UudHlwZV0/XG4gICAgICAgIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZVxuICAgIGVsc2VcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gW11cbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlIG5vdCBpbiBbJ2xpbmtzJywgJ2xpbmtlZCcsICdtZXRhJywgJ2RhdGEnXVxuICAgICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCcsIHR5cGUsICdjb2xsZWN0aW9uIG9mJywgcmVzb3VyY2VzLmxlbmd0aCA/IDFcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZSB1bmxlc3MgQHR5cGVzW3R5cGVdP1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIHByaW1hcnlSZXN1bHRzLnB1c2ggQHR5cGVzW3R5cGVdLmNyZWF0ZVJlc291cmNlIHJlc291cmNlLCB0eXBlXG5cbiAgICBwcmludC5pbmZvICdQcmltYXJ5IHJlc291cmNlczonLCBwcmltYXJ5UmVzdWx0c1xuICAgIHByaW1hcnlSZXN1bHRzXG5cbiAgaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHVubGVzcyBAdHlwZXNbdHlwZU5hbWVdP1xuICAgICAgQGNyZWF0ZVR5cGUgdHlwZU5hbWVcblxuICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdID89IHt9XG4gICAgaWYgaHJlZlRlbXBsYXRlP1xuICAgICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0uaHJlZiA9IGhyZWZUZW1wbGF0ZVxuICAgIGlmIGF0dHJpYnV0ZVR5cGVOYW1lP1xuICAgICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0udHlwZSA9IGF0dHJpYnV0ZU5hbWVcblxuICBjcmVhdGVUeXBlOiAobmFtZSkgLT5cbiAgICBuZXcgVHlwZSBuYW1lOiBuYW1lLCBhcGlDbGllbnQ6IHRoaXNcblxubW9kdWxlLmV4cG9ydHMudXRpbCA9IHttYWtlSFRUUFJlcXVlc3R9XG4iLCIjIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycywgbW9kaWZ5KSAtPlxuICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3RcbiAgICByZXF1ZXN0Lm9wZW4gbWV0aG9kLCBlbmNvZGVVUkkgdXJsXG5cbiAgICByZXF1ZXN0LndpdGhDcmVkZW50aWFscyA9IHRydWVcblxuICAgIGlmIGhlYWRlcnM/XG4gICAgICBmb3IgaGVhZGVyLCB2YWx1ZSBvZiBoZWFkZXJzXG4gICAgICAgIHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlciBoZWFkZXIsIHZhbHVlXG5cbiAgICBpZiBtb2RpZnk/XG4gICAgICBtb2RpZmljYXRpb25zID0gbW9kaWZ5IHJlcXVlc3RcblxuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyAnUmVhZHkgc3RhdGU6JywgKGtleSBmb3Iga2V5LCB2YWx1ZSBvZiByZXF1ZXN0IHdoZW4gdmFsdWUgaXMgcmVxdWVzdC5yZWFkeVN0YXRlIGFuZCBrZXkgaXNudCAncmVhZHlTdGF0ZScpWzBdXG4gICAgICBpZiByZXF1ZXN0LnJlYWR5U3RhdGUgaXMgcmVxdWVzdC5ET05FXG4gICAgICAgIGNvbnNvbGUubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZSAjIGlmIDQwMCA8PSByZXF1ZXN0LnN0YXR1cyA8IDYwMFxuICAgICAgICAgIHJlamVjdCByZXF1ZXN0XG5cbiAgICByZXF1ZXN0LnNlbmQgSlNPTi5zdHJpbmdpZnkgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsInByaW50ID0gKGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgY29uc29sZS5sb2cgJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCIsIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBpZDogJydcbiAgaHJlZjogJydcbiAgdHlwZTogJydcblxuICBfdHlwZTogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLiBpZiBjb25maWc/XG4gICAgY29uc29sZT8ubG9nIFwiQ3JlYXRlZCByZXNvdXJjZTogI3tAX3R5cGUubmFtZX0gI3tAaWR9XCIsIHRoaXNcbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIGNvbnNvbGUubG9nICdDcmVhdGVkISdcblxuICAjIEdldCBhIHByb21pc2UgZm9yIGFuIGF0dHJpYnV0ZSByZWZlcnJpbmcgdG8gKGFuKW90aGVyIHJlc291cmNlKHMpLlxuICBhdHRyOiAoYXR0cmlidXRlKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcgbGluazonLCBhdHRyaWJ1dGVcbiAgICBpZiBhdHRyaWJ1dGUgb2YgdGhpc1xuICAgICAgY29uc29sZT8ud2FybiBcIk5vIG5lZWQgdG8gYWNjZXNzIGEgbm9uLWxpbmtlZCBhdHRyaWJ1dGUgdmlhIGF0dHI6ICN7YXR0cmlidXRlfVwiLCB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUgQFthdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBAbGlua3M/IGFuZCBhdHRyaWJ1dGUgb2YgQGxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgcmVzb3VyY2UnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgYXR0cmlidXRlIG9mIEBfdHlwZS5saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUubGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUubmFtZX0gcmVzb3VyY2VcIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLmxpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgaHJlZiA9IGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0IGhyZWZcblxuICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2UgaWYgbGluaz9cbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IGNvbGxlY3Rpb24gb2JqZWN0JywgbGlua1xuICAgICAgIyBJdCdzIGEgY29sbGVjdGlvbiBvYmplY3QuXG4gICAgICB7aHJlZiwgaWRzLCB0eXBlfSA9IGxpbmtcblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBwcmludC53YXJuICdIUkVGJywgaHJlZlxuICAgICAgICBocmVmID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0IGhyZWZcblxuICAgICAgZWxzZSBpZiB0eXBlPyBhbmQgaWRzP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnTGlua2VkLCBidXQgYmxhbmsnXG4gICAgICAjIEl0IGV4aXN0cywgYnV0IGl0J3MgYmxhbmsuXG4gICAgICBQcm9taXNlLnJlc29sdmUgbnVsbFxuXG4gICMgVHVybiBhIEpTT04tQVBJIFwiaHJlZlwiIHRlbXBsYXRlIGludG8gYSB1c2FibGUgVVJMLlxuICBQTEFDRUhPTERFUlNfUEFUVEVSTjogL3soLis/KX0vZ1xuICBhcHBseUhSRUY6IChocmVmLCBjb250ZXh0KSAtPlxuICAgIGhyZWYucmVwbGFjZSBAUExBQ0VIT0xERVJTX1BBVFRFUk4sIChfLCBwYXRoKSAtPlxuICAgICAgc2VnbWVudHMgPSBwYXRoLnNwbGl0ICcuJ1xuICAgICAgcHJpbnQud2FybiAnU2VnbWVudHMnLCBzZWdtZW50c1xuXG4gICAgICB2YWx1ZSA9IGNvbnRleHRcbiAgICAgIHVudGlsIHNlZ21lbnRzLmxlbmd0aCBpcyAwXG4gICAgICAgIHNlZ21lbnQgPSBzZWdtZW50cy5zaGlmdCgpXG4gICAgICAgIHZhbHVlID0gdmFsdWVbc2VnbWVudF0gPyB2YWx1ZS5saW5rcz9bc2VnbWVudF1cblxuICAgICAgcHJpbnQud2FybiAnVmFsdWUnLCB2YWx1ZVxuXG4gICAgICBpZiBBcnJheS5pc0FycmF5IHZhbHVlXG4gICAgICAgIHZhbHVlID0gdmFsdWUuam9pbiAnLCdcblxuICAgICAgdW5sZXNzIHR5cGVvZiB2YWx1ZSBpcyAnc3RyaW5nJ1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCJWYWx1ZSBmb3IgJyN7cGF0aH0nIGluICcje2hyZWZ9JyBzaG91bGQgYmUgYSBzdHJpbmcuXCJcblxuICAgICAgdmFsdWVcblxuICB1cGRhdGU6IChjaGFuZ2VzLi4uKSAtPlxuICAgIG1lcmdlSW50byB0aGlzLCBjaGFuZ2VzLi4uXG4gICAgQGVtaXQgJ2NoYW5nZSdcblxuICBzYXZlOiAtPlxuICAgIEBlbWl0ICd3aWxsLXNhdmUnXG4gICAgc2F2ZSA9IGlmIEBpZFxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wdXQgQGdldFVSTCgpLCB0aGlzXG4gICAgZWxzZVxuICAgICAgQF90eXBlLmFwaUNsaWVudC5wb3N0IEBfdHlwZS5nZXRVUkwoKSwgdGhpc1xuXG4gICAgc2F2ZS50aGVuIChyZXN1bHRzKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRzXG4gICAgICBAZW1pdCAnc2F2ZSdcblxuICBkZWxldGU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtZGVsZXRlJ1xuICAgIGRlbGV0aW9uID0gaWYgQGlkXG4gICAgICBAX3R5cGUuYXBpQ2xpZW50LmRlbGV0ZSBAZ2V0VVJMKClcbiAgICBlbHNlXG4gICAgICAjIEBfdHlwZS5yZW1vdmVSZXNvdXJjZSB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgc3VwZXJcbiAgICBAX3R5cGUuX2hhbmRsZVJlc291cmNlRW1pc3Npb24gdGhpcywgYXJndW1lbnRzLi4uXG5cbiAgZ2V0VVJMOiAtPlxuICAgIEBocmVmIHx8IFtAX3R5cGUuZ2V0VVJMKCksIEBpZF0uam9pbiAnLydcblxuICB0b0pTT046IC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHRbQF90eXBlLm5hbWVdID0ge31cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5LmNoYXJBdCgwKSBpc250ICdfJyBhbmQga2V5IG5vdCBvZiBAY29uc3RydWN0b3IucHJvdG90eXBlXG4gICAgICByZXN1bHRbQF90eXBlLm5hbWVdW2tleV0gPSB2YWx1ZVxuICAgIHJlc3VsdFxuIiwicHJpbnQgPSByZXF1aXJlICcuL3ByaW50J1xuRW1pdHRlciA9IHJlcXVpcmUgJy4vZW1pdHRlcidcbm1lcmdlSW50byA9IHJlcXVpcmUgJy4vbWVyZ2UtaW50bydcblJlc291cmNlID0gcmVxdWlyZSAnLi9yZXNvdXJjZSdcblxuZGVmZXIgPSAtPlxuICBkZWZlcnJhbCA9IHt9XG4gIGRlZmVycmFsLnByb21pc2UgPSBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIGRlZmVycmFsLnJlc29sdmUgPSByZXNvbHZlXG4gICAgZGVmZXJyYWwucmVqZWN0ID0gcmVqZWN0XG4gIGRlZmVycmFsXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZSBleHRlbmRzIEVtaXR0ZXJcbiAgbmFtZTogJydcbiAgYXBpQ2xpZW50OiBudWxsXG5cbiAgbGlua3M6IG51bGxcblxuICBkZWZlcnJhbHM6IG51bGxcbiAgcmVzb3VyY2VQcm9taXNlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlncy4uLikgLT5cbiAgICBzdXBlclxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWdzLi4uIGlmIGNvbmZpZ3M/XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5pbmcgYSBuZXcgcmVzb3VyY2UgdHlwZTonLCBAbmFtZVxuICAgIEBsaW5rcyA/PSB7fVxuICAgIEBkZWZlcnJhbHMgPz0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA/PSB7fVxuICAgIEBhcGlDbGllbnQudHlwZXNbQG5hbWVdID0gdGhpc1xuXG4gIGdldFVSTDogLT5cbiAgICAnLycgKyBAbmFtZVxuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBQcm9taXNlLmFsbChyZXNvdXJjZVByb21pc2UgZm9yIGlkLCByZXNvdXJjZVByb21pc2Ugb2YgQHJlc291cmNlUHJvbWlzZXMpLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgIHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZT8ubWF0Y2hlc1F1ZXJ5IHF1ZXJ5XG5cbiAgd2FpdGluZ0ZvcjogKGlkKSAtPlxuICAgIEBkZWZlcnJhbHNbaWRdP1xuXG4gIGhhczogKGlkKSAtPlxuICAgIEByZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAZGVmZXJyYWxzW2lkXT9cblxuICBnZXQ6IC0+XG4gICAgaWYgdHlwZW9mIGFyZ3VtZW50c1swXSBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGFyZ3VtZW50c1swXVxuICAgICAgQGdldEJ5SURzIGFyZ3VtZW50cy4uLlxuICAgIGVsc2VcbiAgICAgIEBnZXRCeVF1ZXJ5IGFyZ3VtZW50cy4uLlxuXG4gICMgR2l2ZW4gYSBzdHJpbmcsIHJldHVybiBhIHByb21pc2UgZm9yIHRoYXQgcmVzb3VyY2UuXG4gICMgR2l2ZW4gYW4gYXJyYXksIHJldHVybiBhbiBhcnJheSBvZiBwcm9taXNlcyBmb3IgdGhvc2UgcmVzb3VyY2VzLlxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucykgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nJywgQG5hbWUsICdieSBJRChzKScsIGlkc1xuICAgIGlmIHR5cGVvZiBpZHMgaXMgJ3N0cmluZydcbiAgICAgIGdpdmVuU3RyaW5nID0gdHJ1ZVxuICAgICAgaWRzID0gW2lkc11cblxuICAgICMgT25seSByZXF1ZXN0IHRoaW5ncyB3ZSBkb24ndCBoYXZlIG9yIGRvbid0IGFscmVhZHkgaGF2ZSBhIHJlcXVlc3Qgb3V0IGZvci5cbiAgICBpbmNvbWluZyA9IChpZCBmb3IgaWQgaW4gaWRzIHdoZW4gbm90IEBoYXMoaWQpIGFuZCBub3QgQHdhaXRpbmdGb3IoaWQpKVxuICAgIHByaW50LmxvZyAnSW5jb21pbmc6ICcsIGluY29taW5nXG5cbiAgICB1bmxlc3MgaW5jb21pbmcubGVuZ3RoIGlzIDBcbiAgICAgIGZvciBpZCBpbiBpbmNvbWluZ1xuICAgICAgICBAZGVmZXJyYWxzW2lkXSA9IGRlZmVyKClcbiAgICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRdID0gQGRlZmVycmFsc1tpZF0ucHJvbWlzZVxuXG4gICAgICB1cmwgPSBbQGdldFVSTCgpLCBpbmNvbWluZy5qb2luICcsJ10uam9pbiAnLydcbiAgICAgIHByaW50LmxvZyAnUmVxdWVzdCBmb3InLCBAbmFtZSwgJ2F0JywgdXJsXG4gICAgICBAYXBpQ2xpZW50LmdldCh1cmwsIG9wdGlvbnMpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgcHJpbnQubG9nICdHb3QnLCBAbmFtZSwgcmVzb3VyY2VzXG5cbiAgICBpZiBnaXZlblN0cmluZ1xuICAgICAgQHJlc291cmNlUHJvbWlzZXNbaWRzWzBdXVxuICAgIGVsc2VcbiAgICAgIFByb21pc2UuYWxsIChAcmVzb3VyY2VQcm9taXNlc1tpZF0gZm9yIGlkIGluIGlkcylcblxuICBnZXRCeVF1ZXJ5OiAocXVlcnksIGxpbWl0ID0gSW5maW5pdHkpIC0+XG4gICAgQHF1ZXJ5TG9jYWwocXVlcnkpLnRoZW4gKGV4aXN0aW5nKSA9PlxuICAgICAgaWYgZXhpc3RpbmcubGVuZ3RoID49IGxpbWl0XG4gICAgICAgIGV4aXN0aW5nXG4gICAgICBlbHNlXG4gICAgICAgIHBhcmFtcyA9IGxpbWl0OiBsaW1pdCAtIGV4aXN0aW5nLmxlbmd0aFxuICAgICAgICBAYXBpQ2xpZW50LmdldChAZ2V0VVJMKCksIG1lcmdlSW50byBwYXJhbXMsIHF1ZXJ5KS50aGVuIChyZXNvdXJjZXMpID0+XG4gICAgICAgICAgUHJvbWlzZS5hbGwgZXhpc3RpbmcuY29uY2F0IHJlc291cmNlc1xuXG4gIGNyZWF0ZVJlc291cmNlOiAoZGF0YSkgLT5cbiAgICBpZiBAd2FpdGluZ0ZvciBkYXRhLmlkXG4gICAgICBwcmludC5sb2cgJ1Jlc29sdmluZyBhbmQgcmVtb3ZpbmcgZGVmZXJyYWwgZm9yJywgQG5hbWUsIGRhdGEuaWRcbiAgICAgIEBkZWZlcnJhbHNbZGF0YS5pZF0ucmVzb2x2ZSBuZXcgUmVzb3VyY2UgZGF0YSwgX3R5cGU6IHRoaXNcbiAgICAgIEBkZWZlcnJhbHNbZGF0YS5pZF0gPSBudWxsXG4gICAgZWxzZSBpZiBAaGFzIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnVGhlJywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWQsICdleGlzdHM7IHdpbGwgdXBkYXRlJ1xuICAgICAgQGdldChkYXRhLmlkKS50aGVuIChyZXNvdXJjZSkgLT5cbiAgICAgICAgcmVzb3VyY2UudXBkYXRlIGRhdGFcbiAgICBlbHNlXG4gICAgICBwcmludC5sb2cgJ0NyZWF0aW5nIG5ldycsIEBuYW1lLCAncmVzb3VyY2UnLCBkYXRhLmlkXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tkYXRhLmlkXSA9IFByb21pc2UucmVzb2x2ZSBuZXcgUmVzb3VyY2UgZGF0YSwgX3R5cGU6IHRoaXNcblxuICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdXG5cbiAgX2hhbmRsZVJlc291cmNlRW1pc3Npb246IChyZXNvdXJjZSwgc2lnbmFsLCBwYXlsb2FkKSAtPlxuICAgIEBlbWl0ICdjaGFuZ2UnXG4iXX0=

