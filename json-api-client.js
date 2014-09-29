(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

if (typeof window !== "undefined" && window !== null) {
  window.JSONAPIClient = module.exports;
}



},{"./make-http-request":3,"./merge-into":4,"./print":5,"./type":7}],3:[function(_dereq_,module,exports){
module.exports = function(method, url, data, headers) {
  console.log('Making', method, 'request to', url);
  return new Promise(function(resolve, reject) {
    var header, request, value;
    request = new XMLHttpRequest;
    request.open(method, encodeURI(url));
    if (headers != null) {
      for (header in headers) {
        value = headers[header];
        request.setRequestHeader(header, value);
      }
    }
    request.onreadystatechange = function(e) {
      var key, _ref, _ref1;
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
        } else if ((400 <= (_ref1 = request.status) && _ref1 < 600)) {
          return reject(new Error(request.responseText));
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
    var save, url;
    this.emit('will-save');
    save = this.id ? (url = this.href || [this._type.getURL(), this.id].join('/'), api.put(url, this)) : api.post(this._type.getURL(), this);
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
    deletion = this.id ? this._getURL().then(function(url) {
      return api["delete"](url);
    }) : Promise.resolve();
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
var Emitter, Resource, Type, mergeInto, print,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

print = _dereq_('./print');

Emitter = _dereq_('./emitter');

mergeInto = _dereq_('./merge-into');

Resource = _dereq_('./resource');

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
        this.deferrals[id] = Promise.defer();
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



},{"./emitter":1,"./merge-into":4,"./print":5,"./resource":6}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL2VtaXR0ZXIuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvanNvbi1hcGktY2xpZW50LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL21ha2UtaHR0cC1yZXF1ZXN0LmNvZmZlZSIsIi9Vc2Vycy9icmlhbi9Ecm9wYm94L1B1YmxpYy9qc29uLWFwaS1jbGllbnQvc3JjL21lcmdlLWludG8uY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvcHJpbnQuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvcmVzb3VyY2UuY29mZmVlIiwiL1VzZXJzL2JyaWFuL0Ryb3Bib3gvUHVibGljL2pzb24tYXBpLWNsaWVudC9zcmMvdHlwZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLE9BQUE7RUFBQSxrQkFBQTs7QUFBQSxNQUFNLENBQUMsT0FBUCxHQUF1QjtBQUNyQixvQkFBQSxVQUFBLEdBQVksSUFBWixDQUFBOztBQUVhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLElBQUEsSUFBQyxDQUFBLFVBQUQsR0FBYyxFQUFkLENBRFc7RUFBQSxDQUZiOztBQUFBLG9CQUtBLE1BQUEsR0FBUSxTQUFDLE1BQUQsRUFBUyxRQUFULEdBQUE7QUFDTixRQUFBLEtBQUE7O1dBQVksQ0FBQSxNQUFBLElBQVc7S0FBdkI7V0FDQSxJQUFDLENBQUEsVUFBVyxD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c291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbWl0dGVyXG4gIF9jYWxsYmFja3M6IG51bGxcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAX2NhbGxiYWNrcyA9IHt9XG5cbiAgbGlzdGVuOiAoc2lnbmFsLCBjYWxsYmFjaykgLT5cbiAgICBAX2NhbGxiYWNrc1tzaWduYWxdID89IFtdXG4gICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5wdXNoIGNhbGxiYWNrXG5cbiAgc3RvcExpc3RlbmluZzogKHNpZ25hbCwgY2FsbGJhY2spIC0+XG4gICAgaWYgc2lnbmFsP1xuICAgICAgaWYgQF9jYWxsYmFja3Nbc2lnbmFsXT9cbiAgICAgICAgaWYgY2FsbGJhY2s/XG4gICAgICAgICAgaWYgQXJyYXkuaXNBcnJheSBjYWxsYmFja1xuICAgICAgICAgICAgIyBBcnJheS1zdHlsZSBjYWxsYmFja3MgbmVlZCBub3QgYmUgdGhlIGV4YWN0IHNhbWUgb2JqZWN0LlxuICAgICAgICAgICAgaW5kZXggPSAtMVxuICAgICAgICAgICAgZm9yIGhhbmRsZXIsIGkgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXSBieSAtMSB3aGVuIEFycmF5LmlzQXJyYXkoaGFuZGxlcikgYW5kIGNhbGxiYWNrLmxlbmd0aCBpcyBoYW5kbGVyLmxlbmd0aFxuICAgICAgICAgICAgICBpZiAobnVsbCBmb3IgaXRlbSwgaiBpbiBjYWxsYmFjayB3aGVuIGhhbmRsZXJbal0gaXMgaXRlbSkubGVuZ3RoIGlzIGNhbGxiYWNrLmxlbmd0aFxuICAgICAgICAgICAgICAgIGluZGV4ID0gaVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSBAX2NhbGxiYWNrc1tzaWduYWxdLmxhc3RJbmRleE9mIGNhbGxiYWNrXG4gICAgICAgICAgdW5sZXNzIGluZGV4IGlzIC0xXG4gICAgICAgICAgICBAX2NhbGxiYWNrc1tzaWduYWxdLnNwbGljZSBpbmRleCwgMVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQF9jYWxsYmFja3Nbc2lnbmFsXS5zcGxpY2UgMFxuICAgIGVsc2VcbiAgICAgIEBzdG9wTGlzdGVuaW5nIHNpZ25hbCBmb3Igc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG5cbiAgZW1pdDogKHNpZ25hbCwgcGF5bG9hZC4uLikgLT5cbiAgICBjb25zb2xlPy5sb2cgJ0VtaXR0aW5nJywgc2lnbmFsLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSwgQF9jYWxsYmFja3Nbc2lnbmFsXT8ubGVuZ3RoXG4gICAgaWYgc2lnbmFsIG9mIEBfY2FsbGJhY2tzXG4gICAgICBmb3IgY2FsbGJhY2sgaW4gQF9jYWxsYmFja3Nbc2lnbmFsXVxuICAgICAgICBAX2NhbGxIYW5kbGVyIGNhbGxiYWNrLCBwYXlsb2FkXG5cbiAgX2NhbGxIYW5kbGVyOiAoaGFuZGxlciwgYXJncykgLT5cbiAgICBpZiBBcnJheS5pc0FycmF5IGhhbmRsZXJcbiAgICAgIFtjb250ZXh0LCBoYW5kbGVyLCBib3VuZEFyZ3MuLi5dID0gaGFuZGxlclxuICAgICAgaWYgdHlwZW9mIGhhbmRsZXIgaXMgJ3N0cmluZydcbiAgICAgICAgaGFuZGxlciA9IGNvbnRleHRbaGFuZGxlcl1cbiAgICBlbHNlXG4gICAgICBib3VuZEFyZ3MgPSBbXVxuICAgIGhhbmRsZXIuYXBwbHkgY29udGV4dCwgYm91bmRBcmdzLmNvbmNhdCBhcmdzXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5tYWtlSFRUUFJlcXVlc3QgPSByZXF1aXJlICcuL21ha2UtaHR0cC1yZXF1ZXN0J1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuVHlwZSA9IHJlcXVpcmUgJy4vdHlwZSdcblxuREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQgPVxuICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3ZuZC5hcGkranNvbidcbiAgJ0FjY2VwdCc6IFwiYXBwbGljYXRpb24vdm5kLmFwaStqc29uXCJcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBKU09OQVBJQ2xpZW50XG4gIHJvb3Q6ICcnXG4gIGhlYWRlcnM6IG51bGxcblxuICB0eXBlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQHJvb3QsIEBoZWFkZXJzKSAtPlxuICAgIEB0eXBlcyA9IHt9XG4gICAgcHJpbnQuaW5mbyAnQ3JlYXRlZCBhIG5ldyBKU09OLUFQSSBjbGllbnQgYXQnLCBAcm9vdFxuXG4gIHJlcXVlc3Q6IChtZXRob2QsIHVybCwgZGF0YSwgYWRkaXRpb25hbEhlYWRlcnMpIC0+XG4gICAgcHJpbnQuaW5mbyAnTWFraW5nIGEnLCBtZXRob2QsICdyZXF1ZXN0IHRvJywgdXJsXG4gICAgaGVhZGVycyA9IG1lcmdlSW50byB7fSwgREVGQVVMVF9UWVBFX0FORF9BQ0NFUFQsIEBoZWFkZXJzLCBhZGRpdGlvbmFsSGVhZGVyc1xuICAgIG1ha2VIVFRQUmVxdWVzdChtZXRob2QsIEByb290ICsgdXJsLCBkYXRhLCBoZWFkZXJzKS50aGVuIEBwcm9jZXNzUmVzcG9uc2VUby5iaW5kIHRoaXNcblxuICBmb3IgbWV0aG9kIGluIFsnZ2V0JywgJ3Bvc3QnLCAncHV0JywgJ2RlbGV0ZSddIHRoZW4gZG8gKG1ldGhvZCkgPT5cbiAgICBAOjpbbWV0aG9kXSA9IC0+XG4gICAgICBAcmVxdWVzdCBtZXRob2QudG9VcHBlckNhc2UoKSwgYXJndW1lbnRzLi4uXG5cbiAgcHJvY2Vzc1Jlc3BvbnNlVG86IChyZXF1ZXN0KSAtPlxuICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZSByZXF1ZXN0LnJlc3BvbnNlVGV4dFxuICAgIHByaW50LmxvZyAnUHJvY2Vzc2luZyByZXNwb25zZScsIHJlc3BvbnNlXG5cbiAgICBpZiAnbWV0YScgb2YgcmVzcG9uc2VcbiAgICAgICdUT0RPOiBObyBpZGVhIHlldCEnXG5cbiAgICBpZiAnbGlua3MnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZUFuZEF0dHJpYnV0ZSwgbGluayBvZiByZXNwb25zZS5saW5rc1xuICAgICAgICBbdHlwZSwgYXR0cmlidXRlXSA9IHR5cGVBbmRBdHRyaWJ1dGUuc3BsaXQgJy4nXG4gICAgICAgIGlmIHR5cGVvZiBsaW5rIGlzICdzdHJpbmcnXG4gICAgICAgICAgaHJlZiA9IGxpbmtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHtocmVmLCB0eXBlOiBhdHRyaWJ1dGVUeXBlfSA9IGxpbmtcblxuICAgICAgICBAaGFuZGxlTGluayB0eXBlLCBhdHRyaWJ1dGUsIGhyZWYsIGF0dHJpYnV0ZVR5cGVcblxuICAgIGlmICdsaW5rZWQnIG9mIHJlc3BvbnNlXG4gICAgICBmb3IgdHlwZSwgcmVzb3VyY2VzIG9mIHJlc3BvbnNlLmxpbmtlZFxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIHJlc291cmNlcyA/IDEsICdsaW5rZWQnLCB0eXBlLCAncmVzb3VyY2VzLidcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZSB1bmxlc3MgQHR5cGVzW3R5cGVdP1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZVxuXG4gICAgaWYgJ2RhdGEnIG9mIHJlc3BvbnNlXG4gICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCBcImRhdGFcIiBjb2xsZWN0aW9uIG9mJywgcmVzcG9uc2UuZGF0YS5sZW5ndGggPyAxXG4gICAgICBwcmltYXJ5UmVzdWx0cyA9IGZvciByZXNvdXJjZSBpbiBbXS5jb25jYXQgcmVzcG9uc2UuZGF0YVxuICAgICAgICBAY3JlYXRlVHlwZSByZXNwb25zZS50eXBlIHVubGVzcyBAdHlwZXNbcmVzb3VyY2UudHlwZV0/XG4gICAgICAgIEB0eXBlc1t0eXBlXS5jcmVhdGVSZXNvdXJjZSByZXNvdXJjZVxuICAgIGVsc2VcbiAgICAgIHByaW1hcnlSZXN1bHRzID0gW11cbiAgICAgIGZvciB0eXBlLCByZXNvdXJjZXMgb2YgcmVzcG9uc2Ugd2hlbiB0eXBlIG5vdCBpbiBbJ2xpbmtzJywgJ2xpbmtlZCcsICdtZXRhJywgJ2RhdGEnXVxuICAgICAgICBwcmludC5sb2cgJ0dvdCBhIHRvcC1sZXZlbCcsIHR5cGUsICdjb2xsZWN0aW9uIG9mJywgcmVzb3VyY2VzLmxlbmd0aCA/IDFcbiAgICAgICAgQGNyZWF0ZVR5cGUgdHlwZSB1bmxlc3MgQHR5cGVzW3R5cGVdP1xuICAgICAgICBmb3IgcmVzb3VyY2UgaW4gW10uY29uY2F0IHJlc291cmNlc1xuICAgICAgICAgIHByaW1hcnlSZXN1bHRzLnB1c2ggQHR5cGVzW3R5cGVdLmNyZWF0ZVJlc291cmNlIHJlc291cmNlLCB0eXBlXG5cbiAgICBwcmludC5pbmZvICdQcmltYXJ5IHJlc291cmNlczonLCBwcmltYXJ5UmVzdWx0c1xuICAgIHByaW1hcnlSZXN1bHRzXG5cbiAgaGFuZGxlTGluazogKHR5cGVOYW1lLCBhdHRyaWJ1dGVOYW1lLCBocmVmVGVtcGxhdGUsIGF0dHJpYnV0ZVR5cGVOYW1lKSAtPlxuICAgIHVubGVzcyBAdHlwZXNbdHlwZU5hbWVdP1xuICAgICAgQGNyZWF0ZVR5cGUgdHlwZU5hbWVcblxuICAgIEB0eXBlc1t0eXBlTmFtZV0ubGlua3NbYXR0cmlidXRlVHlwZU5hbWVdID89IHt9XG4gICAgaWYgaHJlZlRlbXBsYXRlP1xuICAgICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0uaHJlZiA9IGhyZWZUZW1wbGF0ZVxuICAgIGlmIGF0dHJpYnV0ZVR5cGVOYW1lP1xuICAgICAgQHR5cGVzW3R5cGVOYW1lXS5saW5rc1thdHRyaWJ1dGVUeXBlTmFtZV0udHlwZSA9IGF0dHJpYnV0ZU5hbWVcblxuICBjcmVhdGVUeXBlOiAobmFtZSkgLT5cbiAgICBuZXcgVHlwZSBuYW1lOiBuYW1lLCBhcGlDbGllbnQ6IHRoaXNcblxubW9kdWxlLmV4cG9ydHMudXRpbCA9IHttYWtlSFRUUFJlcXVlc3R9XG5cbndpbmRvdz8uSlNPTkFQSUNsaWVudCA9IG1vZHVsZS5leHBvcnRzXG4iLCIjIE1ha2UgYSByYXcsIG5vbi1BUEkgc3BlY2lmaWMgSFRUUCByZXF1ZXN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IChtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycykgLT5cbiAgY29uc29sZS5sb2cgJ01ha2luZycsIG1ldGhvZCwgJ3JlcXVlc3QgdG8nLCB1cmxcbiAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG4gICAgcmVxdWVzdC5vcGVuIG1ldGhvZCwgZW5jb2RlVVJJIHVybFxuXG4gICAgaWYgaGVhZGVycz9cbiAgICAgIGZvciBoZWFkZXIsIHZhbHVlIG9mIGhlYWRlcnNcbiAgICAgICAgcmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyIGhlYWRlciwgdmFsdWVcblxuICAgIHJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gKGUpIC0+XG4gICAgICBjb25zb2xlLmxvZyAnUmVhZHkgc3RhdGU6JywgKGtleSBmb3Iga2V5LCB2YWx1ZSBvZiByZXF1ZXN0IHdoZW4gdmFsdWUgaXMgcmVxdWVzdC5yZWFkeVN0YXRlIGFuZCBrZXkgaXNudCAncmVhZHlTdGF0ZScpWzBdXG4gICAgICBpZiByZXF1ZXN0LnJlYWR5U3RhdGUgaXMgcmVxdWVzdC5ET05FXG4gICAgICAgIGNvbnNvbGUubG9nICdEb25lOyBzdGF0dXMgaXMnLCByZXF1ZXN0LnN0YXR1c1xuICAgICAgICBpZiAyMDAgPD0gcmVxdWVzdC5zdGF0dXMgPCAzMDBcbiAgICAgICAgICByZXNvbHZlIHJlcXVlc3RcbiAgICAgICAgZWxzZSBpZiA0MDAgPD0gcmVxdWVzdC5zdGF0dXMgPCA2MDBcbiAgICAgICAgICByZWplY3QgbmV3IEVycm9yIHJlcXVlc3QucmVzcG9uc2VUZXh0XG5cbiAgICByZXF1ZXN0LnNlbmQgSlNPTi5zdHJpbmdpZnkgZGF0YVxuIiwiIyBUaGlzIGlzIGEgcHJldHR5IHN0YW5kYXJkIG1lcmdlIGZ1bmN0aW9uLlxuIyBNZXJnZSBwcm9wZXJ0aWVzIG9mIGFsbCBhcmd1ZW1lbnRzIGludG8gdGhlIGZpcnN0LlxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG4gIGZvciBhcmd1bWVudCBpbiBBcnJheTo6c2xpY2UuY2FsbCBhcmd1bWVudHMsIDEgd2hlbiBhcmd1bWVudD9cbiAgICBmb3Iga2V5LCB2YWx1ZSBvZiBhcmd1bWVudFxuICAgICAgYXJndW1lbnRzWzBdW2tleV0gPSB2YWx1ZVxuICBhcmd1bWVudHNbMF1cbiIsInByaW50ID0gKGNvbG9yLCBtZXNzYWdlcy4uLikgLT5cbiAgY29uc29sZS5sb2cgJyVje2pzb246YXBpfScsIFwiY29sb3I6ICN7Y29sb3J9OyBmb250OiBib2xkIDFlbSBtb25vc3BhY2U7XCIsIG1lc3NhZ2VzLi4uXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbG9nOiBwcmludC5iaW5kIG51bGwsICdncmF5J1xuICBpbmZvOiBwcmludC5iaW5kIG51bGwsICdibHVlJ1xuICB3YXJuOiBwcmludC5iaW5kIG51bGwsICdvcmFuZ2UnXG4gIGVycm9yOiBwcmludC5iaW5kIG51bGwsICdyZWQnXG4iLCJwcmludCA9IHJlcXVpcmUgJy4vcHJpbnQnXG5FbWl0dGVyID0gcmVxdWlyZSAnLi9lbWl0dGVyJ1xubWVyZ2VJbnRvID0gcmVxdWlyZSAnLi9tZXJnZS1pbnRvJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFJlc291cmNlIGV4dGVuZHMgRW1pdHRlclxuICBpZDogJydcbiAgaHJlZjogJydcbiAgdHlwZTogJydcblxuICBfdHlwZTogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlnLi4uKSAtPlxuICAgIHN1cGVyXG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNvbmZpZy4uLiBpZiBjb25maWc/XG4gICAgY29uc29sZT8ubG9nIFwiQ3JlYXRlZCByZXNvdXJjZTogI3tAX3R5cGUubmFtZX0gI3tAaWR9XCIsIHRoaXNcbiAgICBAZW1pdCAnY3JlYXRlJ1xuICAgIGNvbnNvbGUubG9nICdDcmVhdGVkISdcblxuICAjIEdldCBhIHByb21pc2UgZm9yIGFuIGF0dHJpYnV0ZSByZWZlcnJpbmcgdG8gKGFuKW90aGVyIHJlc291cmNlKHMpLlxuICBhdHRyOiAoYXR0cmlidXRlKSAtPlxuICAgIHByaW50LmluZm8gJ0dldHRpbmcgbGluazonLCBhdHRyaWJ1dGVcbiAgICBpZiBhdHRyaWJ1dGUgb2YgdGhpc1xuICAgICAgY29uc29sZT8ud2FybiBcIk5vIG5lZWQgdG8gYWNjZXNzIGEgbm9uLWxpbmtlZCBhdHRyaWJ1dGUgdmlhIGF0dHI6ICN7YXR0cmlidXRlfVwiLCB0aGlzXG4gICAgICBQcm9taXNlLnJlc29sdmUgQFthdHRyaWJ1dGVdXG4gICAgZWxzZSBpZiBAbGlua3M/IGFuZCBhdHRyaWJ1dGUgb2YgQGxpbmtzXG4gICAgICBwcmludC5sb2cgJ0xpbmsgb2YgcmVzb3VyY2UnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAbGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2UgaWYgYXR0cmlidXRlIG9mIEBfdHlwZS5saW5rc1xuICAgICAgcHJpbnQubG9nICdMaW5rIG9mIHR5cGUnXG4gICAgICBAX2dldExpbmsgYXR0cmlidXRlLCBAX3R5cGUubGlua3NbYXR0cmlidXRlXVxuICAgIGVsc2VcbiAgICAgIHByaW50LmVycm9yICdOb3QgYSBsaW5rIGF0IGFsbCdcbiAgICAgIFByb21pc2UucmVqZWN0IG5ldyBFcnJvciBcIk5vIGF0dHJpYnV0ZSAje2F0dHJpYnV0ZX0gb2YgI3tAX3R5cGUubmFtZX0gcmVzb3VyY2VcIlxuXG4gIF9nZXRMaW5rOiAobmFtZSwgbGluaykgLT5cbiAgICBpZiB0eXBlb2YgbGluayBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGxpbmtcbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IElEKHMpJ1xuICAgICAgaWRzID0gbGlua1xuICAgICAge2hyZWYsIHR5cGV9ID0gQF90eXBlLmxpbmtzW25hbWVdXG5cbiAgICAgIGlmIGhyZWY/XG4gICAgICAgIGNvbnRleHQgPSB7fVxuICAgICAgICBjb250ZXh0W0BfdHlwZS5uYW1lXSA9IHRoaXNcbiAgICAgICAgaHJlZiA9IGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0IGhyZWZcblxuICAgICAgZWxzZSBpZiB0eXBlP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2UgaWYgbGluaz9cbiAgICAgIHByaW50LmxvZyAnTGlua2VkIGJ5IGNvbGxlY3Rpb24gb2JqZWN0JywgbGlua1xuICAgICAgIyBJdCdzIGEgY29sbGVjdGlvbiBvYmplY3QuXG4gICAgICB7aHJlZiwgaWRzLCB0eXBlfSA9IGxpbmtcblxuICAgICAgaWYgaHJlZj9cbiAgICAgICAgY29udGV4dCA9IHt9XG4gICAgICAgIGNvbnRleHRbQF90eXBlLm5hbWVdID0gdGhpc1xuICAgICAgICBwcmludC53YXJuICdIUkVGJywgaHJlZlxuICAgICAgICBocmVmID0gQGFwcGx5SFJFRiBocmVmLCBjb250ZXh0XG4gICAgICAgIEBfdHlwZS5hcGlDbGllbnQuZ2V0IGhyZWZcblxuICAgICAgZWxzZSBpZiB0eXBlPyBhbmQgaWRzP1xuICAgICAgICB0eXBlID0gQF90eXBlLmFwaUNsaWVudC50eXBlc1t0eXBlXVxuICAgICAgICB0eXBlLmdldCBpZHNcblxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnTGlua2VkLCBidXQgYmxhbmsnXG4gICAgICAjIEl0IGV4aXN0cywgYnV0IGl0J3MgYmxhbmsuXG4gICAgICBQcm9taXNlLnJlc29sdmUgbnVsbFxuXG4gICMgVHVybiBhIEpTT04tQVBJIFwiaHJlZlwiIHRlbXBsYXRlIGludG8gYSB1c2FibGUgVVJMLlxuICBQTEFDRUhPTERFUlNfUEFUVEVSTjogL3soLis/KX0vZ1xuICBhcHBseUhSRUY6IChocmVmLCBjb250ZXh0KSAtPlxuXG4gICAgaHJlZi5yZXBsYWNlIEBQTEFDRUhPTERFUlNfUEFUVEVSTiwgKF8sIHBhdGgpIC0+XG4gICAgICBzZWdtZW50cyA9IHBhdGguc3BsaXQgJy4nXG4gICAgICBwcmludC53YXJuICdTZWdtZW50cycsIHNlZ21lbnRzXG5cbiAgICAgIHZhbHVlID0gY29udGV4dFxuICAgICAgdW50aWwgc2VnbWVudHMubGVuZ3RoIGlzIDBcbiAgICAgICAgc2VnbWVudCA9IHNlZ21lbnRzLnNoaWZ0KClcbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtzZWdtZW50XSA/IHZhbHVlLmxpbmtzP1tzZWdtZW50XVxuXG4gICAgICBwcmludC53YXJuICdWYWx1ZScsIHZhbHVlXG5cbiAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmFsdWVcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luICcsJ1xuXG4gICAgICB1bmxlc3MgdHlwZW9mIHZhbHVlIGlzICdzdHJpbmcnXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlZhbHVlIGZvciAnI3twYXRofScgaW4gJyN7aHJlZn0nIHNob3VsZCBiZSBhIHN0cmluZy5cIlxuXG4gICAgICB2YWx1ZVxuXG4gIHVwZGF0ZTogKGNoYW5nZXMuLi4pIC0+XG4gICAgbWVyZ2VJbnRvIHRoaXMsIGNoYW5nZXMuLi5cbiAgICBAZW1pdCAnY2hhbmdlJ1xuXG4gIHNhdmU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtc2F2ZSdcbiAgICBzYXZlID0gaWYgQGlkXG4gICAgICB1cmwgPSBAaHJlZiB8fCBbQF90eXBlLmdldFVSTCgpLCBAaWRdLmpvaW4gJy8nXG4gICAgICBhcGkucHV0IHVybCwgdGhpc1xuICAgIGVsc2VcbiAgICAgIGFwaS5wb3N0IEBfdHlwZS5nZXRVUkwoKSwgdGhpc1xuXG4gICAgc2F2ZS50aGVuIChyZXN1bHRzKSA9PlxuICAgICAgQHVwZGF0ZSByZXN1bHRzXG4gICAgICBAZW1pdCAnc2F2ZSdcblxuICBkZWxldGU6IC0+XG4gICAgQGVtaXQgJ3dpbGwtZGVsZXRlJ1xuICAgIGRlbGV0aW9uID0gaWYgQGlkXG4gICAgICBAX2dldFVSTCgpLnRoZW4gKHVybCkgLT5cbiAgICAgICAgYXBpLmRlbGV0ZSB1cmxcbiAgICBlbHNlXG4gICAgICBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgZGVsZXRpb24udGhlbiA9PlxuICAgICAgQGVtaXQgJ2RlbGV0ZSdcblxuICBtYXRjaGVzUXVlcnk6IChxdWVyeSkgLT5cbiAgICBtYXRjaGVzID0gdHJ1ZVxuICAgIGZvciBwYXJhbSwgdmFsdWUgb2YgcXVlcnlcbiAgICAgIGlmIEBbcGFyYW1dIGlzbnQgdmFsdWVcbiAgICAgICAgbWF0Y2hlcyA9IGZhbHNlXG4gICAgICAgIGJyZWFrXG4gICAgbWF0Y2hlc1xuXG4gIGVtaXQ6IChzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgc3VwZXJcbiAgICBAX3R5cGUuX2hhbmRsZVJlc291cmNlRW1pc3Npb24gdGhpcywgYXJndW1lbnRzLi4uXG5cbiAgdG9KU09OOiAtPlxuICAgIHJlc3VsdCA9IHt9XG4gICAgcmVzdWx0W0BfdHlwZS5uYW1lXSA9IHt9XG4gICAgZm9yIGtleSwgdmFsdWUgb2YgdGhpcyB3aGVuIGtleS5jaGFyQXQoMCkgaXNudCAnXycgYW5kIGtleSBub3Qgb2YgQGNvbnN0cnVjdG9yLnByb3RvdHlwZVxuICAgICAgcmVzdWx0W0BfdHlwZS5uYW1lXVtrZXldID0gdmFsdWVcbiAgICByZXN1bHRcbiIsInByaW50ID0gcmVxdWlyZSAnLi9wcmludCdcbkVtaXR0ZXIgPSByZXF1aXJlICcuL2VtaXR0ZXInXG5tZXJnZUludG8gPSByZXF1aXJlICcuL21lcmdlLWludG8nXG5SZXNvdXJjZSA9IHJlcXVpcmUgJy4vcmVzb3VyY2UnXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZSBleHRlbmRzIEVtaXR0ZXJcbiAgbmFtZTogJydcbiAgYXBpQ2xpZW50OiBudWxsXG5cbiAgbGlua3M6IG51bGxcblxuICBkZWZlcnJhbHM6IG51bGxcbiAgcmVzb3VyY2VQcm9taXNlczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoY29uZmlncy4uLikgLT5cbiAgICBzdXBlclxuICAgIG1lcmdlSW50byB0aGlzLCBjb25maWdzLi4uIGlmIGNvbmZpZ3M/XG4gICAgcHJpbnQuaW5mbyAnRGVmaW5pbmcgYSBuZXcgcmVzb3VyY2UgdHlwZTonLCBAbmFtZVxuICAgIEBsaW5rcyA/PSB7fVxuICAgIEBkZWZlcnJhbHMgPz0ge31cbiAgICBAcmVzb3VyY2VQcm9taXNlcyA/PSB7fVxuICAgIEBhcGlDbGllbnQudHlwZXNbQG5hbWVdID0gdGhpc1xuXG4gIGdldFVSTDogLT5cbiAgICAnLycgKyBAbmFtZVxuXG4gIHF1ZXJ5TG9jYWw6IChxdWVyeSkgLT5cbiAgICBQcm9taXNlLmFsbChyZXNvdXJjZVByb21pc2UgZm9yIGlkLCByZXNvdXJjZVByb21pc2Ugb2YgQHJlc291cmNlUHJvbWlzZXMpLnRoZW4gKHJlc291cmNlcykgLT5cbiAgICAgIHJlc291cmNlIGZvciByZXNvdXJjZSBpbiByZXNvdXJjZXMgd2hlbiByZXNvdXJjZT8ubWF0Y2hlc1F1ZXJ5IHF1ZXJ5XG5cbiAgd2FpdGluZ0ZvcjogKGlkKSAtPlxuICAgIEBkZWZlcnJhbHNbaWRdP1xuXG4gIGhhczogKGlkKSAtPlxuICAgIEByZXNvdXJjZVByb21pc2VzW2lkXT8gYW5kIG5vdCBAZGVmZXJyYWxzW2lkXT9cblxuICBnZXQ6IC0+XG4gICAgaWYgdHlwZW9mIGFyZ3VtZW50c1swXSBpcyAnc3RyaW5nJyBvciBBcnJheS5pc0FycmF5IGFyZ3VtZW50c1swXVxuICAgICAgQGdldEJ5SURzIGFyZ3VtZW50cy4uLlxuICAgIGVsc2VcbiAgICAgIEBnZXRCeVF1ZXJ5IGFyZ3VtZW50cy4uLlxuXG4gICMgR2l2ZW4gYSBzdHJpbmcsIHJldHVybiBhIHByb21pc2UgZm9yIHRoYXQgcmVzb3VyY2UuXG4gICMgR2l2ZW4gYW4gYXJyYXksIHJldHVybiBhbiBhcnJheSBvZiBwcm9taXNlcyBmb3IgdGhvc2UgcmVzb3VyY2VzLlxuICBnZXRCeUlEczogKGlkcywgb3B0aW9ucykgLT5cbiAgICBwcmludC5pbmZvICdHZXR0aW5nJywgQG5hbWUsICdieSBJRChzKScsIGlkc1xuICAgIGlmIHR5cGVvZiBpZHMgaXMgJ3N0cmluZydcbiAgICAgIGdpdmVuU3RyaW5nID0gdHJ1ZVxuICAgICAgaWRzID0gW2lkc11cblxuICAgICMgT25seSByZXF1ZXN0IHRoaW5ncyB3ZSBkb24ndCBoYXZlIG9yIGRvbid0IGFscmVhZHkgaGF2ZSBhIHJlcXVlc3Qgb3V0IGZvci5cbiAgICBpbmNvbWluZyA9IChpZCBmb3IgaWQgaW4gaWRzIHdoZW4gbm90IEBoYXMoaWQpIGFuZCBub3QgQHdhaXRpbmdGb3IoaWQpKVxuICAgIHByaW50LmxvZyAnSW5jb21pbmc6ICcsIGluY29taW5nXG5cbiAgICB1bmxlc3MgaW5jb21pbmcubGVuZ3RoIGlzIDBcbiAgICAgIGZvciBpZCBpbiBpbmNvbWluZ1xuICAgICAgICBAZGVmZXJyYWxzW2lkXSA9IFByb21pc2UuZGVmZXIoKVxuICAgICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZF0gPSBAZGVmZXJyYWxzW2lkXS5wcm9taXNlXG5cbiAgICAgIHVybCA9IFtAZ2V0VVJMKCksIGluY29taW5nLmpvaW4gJywnXS5qb2luICcvJ1xuICAgICAgcHJpbnQubG9nICdSZXF1ZXN0IGZvcicsIEBuYW1lLCAnYXQnLCB1cmxcbiAgICAgIEBhcGlDbGllbnQuZ2V0KHVybCwgb3B0aW9ucykudGhlbiAocmVzb3VyY2VzKSA9PlxuICAgICAgICBwcmludC5sb2cgJ0dvdCcsIEBuYW1lLCByZXNvdXJjZXNcblxuICAgIGlmIGdpdmVuU3RyaW5nXG4gICAgICBAcmVzb3VyY2VQcm9taXNlc1tpZHNbMF1dXG4gICAgZWxzZVxuICAgICAgUHJvbWlzZS5hbGwgKEByZXNvdXJjZVByb21pc2VzW2lkXSBmb3IgaWQgaW4gaWRzKVxuXG4gIGdldEJ5UXVlcnk6IChxdWVyeSwgbGltaXQgPSBJbmZpbml0eSkgLT5cbiAgICBAcXVlcnlMb2NhbChxdWVyeSkudGhlbiAoZXhpc3RpbmcpID0+XG4gICAgICBpZiBleGlzdGluZy5sZW5ndGggPj0gbGltaXRcbiAgICAgICAgZXhpc3RpbmdcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyYW1zID0gbGltaXQ6IGxpbWl0IC0gZXhpc3RpbmcubGVuZ3RoXG4gICAgICAgIEBhcGlDbGllbnQuZ2V0KEBnZXRVUkwoKSwgbWVyZ2VJbnRvIHBhcmFtcywgcXVlcnkpLnRoZW4gKHJlc291cmNlcykgPT5cbiAgICAgICAgICBQcm9taXNlLmFsbCBleGlzdGluZy5jb25jYXQgcmVzb3VyY2VzXG5cbiAgY3JlYXRlUmVzb3VyY2U6IChkYXRhKSAtPlxuICAgIGlmIEB3YWl0aW5nRm9yIGRhdGEuaWRcbiAgICAgIHByaW50LmxvZyAnUmVzb2x2aW5nIGFuZCByZW1vdmluZyBkZWZlcnJhbCBmb3InLCBAbmFtZSwgZGF0YS5pZFxuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuICAgICAgQGRlZmVycmFsc1tkYXRhLmlkXSA9IG51bGxcbiAgICBlbHNlIGlmIEBoYXMgZGF0YS5pZFxuICAgICAgcHJpbnQubG9nICdUaGUnLCBAbmFtZSwgJ3Jlc291cmNlJywgZGF0YS5pZCwgJ2V4aXN0czsgd2lsbCB1cGRhdGUnXG4gICAgICBAZ2V0KGRhdGEuaWQpLnRoZW4gKHJlc291cmNlKSAtPlxuICAgICAgICByZXNvdXJjZS51cGRhdGUgZGF0YVxuICAgIGVsc2VcbiAgICAgIHByaW50LmxvZyAnQ3JlYXRpbmcgbmV3JywgQG5hbWUsICdyZXNvdXJjZScsIGRhdGEuaWRcbiAgICAgIEByZXNvdXJjZVByb21pc2VzW2RhdGEuaWRdID0gUHJvbWlzZS5yZXNvbHZlIG5ldyBSZXNvdXJjZSBkYXRhLCBfdHlwZTogdGhpc1xuXG4gICAgQHJlc291cmNlUHJvbWlzZXNbZGF0YS5pZF1cblxuICBfaGFuZGxlUmVzb3VyY2VFbWlzc2lvbjogKHJlc291cmNlLCBzaWduYWwsIHBheWxvYWQpIC0+XG4gICAgQGVtaXQgJ2NoYW5nZSdcbiJdfQ==

