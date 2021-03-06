//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function () {
  
      // Baseline setup
      // --------------
  
      // Establish the root object, `window` in the browser, or `exports` on the server.
      var root = this;
  
      // Save the previous value of the `_` variable.
      var previousUnderscore = root._;
  
      // Save bytes in the minified (but not gzipped) version:
      var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
  
      // Create quick reference variables for speed access to core prototypes.
      var
          push = ArrayProto.push,
          slice = ArrayProto.slice,
          toString = ObjProto.toString,
          hasOwnProperty = ObjProto.hasOwnProperty;
  
      // All **ECMAScript 5** native function implementations that we hope to use
      //es5的一些新的原生的方法
      var
          nativeIsArray = Array.isArray,
          nativeKeys = Object.keys,
          nativeBind = FuncProto.bind,
          nativeCreate = Object.create;
  
      // Naked function reference for surrogate-prototype-swapping.
      var Ctor = function () {
      };
  
      //underscore的核心_
      var _ = function (obj) {
          //判断对象是否是_的实例
          if (obj instanceof _) return obj;
          //这样做的好处是保证this永远指向_也就是underscore本身
          if (!(this instanceof _)) return new _(obj);
          //将obj保存到_wrapped这个变量下面
          this._wrapped = obj;
      };
  
      // Export the Underscore object for **Node.js**, with
      // backwards-compatibility for the old `require()` API. If we're in
      // the browser, add `_` as a global object.
      //判断是否为node,将_暴露给node或者window
      if (typeof exports !== 'undefined') {
          if (typeof module !== 'undefined' && module.exports) {
              exports = module.exports = _;
          }
          exports._ = _;
      } else {
          //代码内的第一行就把this赋值给了root
          root._ = _;
      }
  
      // 当前版本号
      _.VERSION = '1.8.3';
  
      //内部函数，主要作用就是改变其他函数的this指向
      //call的性能要比apply高很多
      var optimizeCb = function (func, context, argCount) {
          //这里用void 0 代替undefined 因为undefined在低版本的ie和局部作用域中能被重写
          if (context === void 0) return func;
          switch (argCount == null ? 3 : argCount) {
              case 1:
                  return function (value) {
                      return func.call(context, value);
                  };
              case 2:
                  return function (value, other) {
                      return func.call(context, value, other);
                  };
              case 3:
                  return function (value, index, collection) {
                      return func.call(context, value, index, collection);
                  };
              case 4:
                  return function (accumulator, value, index, collection) {
                      return func.call(context, accumulator, value, index, collection);
                  };
          }
          return function () {
              //arguments是js函数的一个内置属性 是一个类数组，内容是当前函数的所有参数的集合（实参非形参）
              return func.apply(context, arguments);
          };
      };
  
      // A mostly-internal function to generate callbacks that can be applied
      // to each element in a collection, returning the desired result — either
      // identity, an arbitrary callback, a property matcher, or a property accessor.
      var cb = function (value, context, argCount) {
          //如果value不存在(null or undefinied)，则返回一个空的方法 value=>value 这种形式
          if (value == null) return _.identity;
          //如果value是方法就将value的this指向context，然后返回
          if (_.isFunction(value)) return optimizeCb(value, context, argCount);
          //如果是对象的情况，不是方法
          if (_.isObject(value)) return _.matcher(value);
          return _.property(value);
      };
      _.iteratee = function (value, context) {
          return cb(value, context, Infinity);
      };
  
      // An internal function for creating assigner functions.
      var createAssigner = function (keysFunc, undefinedOnly) {
          return function (obj) {
              var length = arguments.length;
              //如果方法参数就只有一个或者没有，就返回传进来的参数 value=>value
              if (length < 2 || obj == null) return obj;
              //遍历方法的arguments对象/实参
              for (var index = 1; index < length; index++) {
                  var source = arguments[index],
                      //处理arguments
                      // 提取对象参数的 keys 值
                      // keysFunc 参数表示 _.keys
                      // 或者 _.allKeys
                      keys = keysFunc(source),
                      l = keys.length;
                  for (var i = 0; i < l; i++) {
                      var key = keys[i];
                      //将所有的arguments对象都以key，value形式传递给obj
                      //如果有同名的key，则只有第一个有效，其余全部无效
                      if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
                  }
              }
              return obj;
          };
      };
  
      // An internal function for creating a new object that inherits from another.
      var baseCreate = function (prototype) {
          //如果参数不是对象 包括方法，对象，不包括null,则返回一个空对象
          if (!_.isObject(prototype)) return {};
          //如果浏览器支持es6的Object.create()，则调用es6原生方法
          if (nativeCreate) return nativeCreate(prototype);
          //设置对象的属性为prototype
          Ctor.prototype = prototype;
          //new 一个对象，如果对象的返回值是值类型，因为ctor是一个空的function 所以会默认返回一个包含prototype属性的对象
          //这里对new的应用非常牛逼！！！
          var result = new Ctor;
          //清空Ctor的属性
          Ctor.prototype = null;
          return result;
      };
  
      //返回一个函数，获取obj的key的属性的值
      var property = function (key) {
          return function (obj) {
              return obj == null ? void 0 : obj[key];
          };
      };
  
      //js里面最大的安全整数
      //超出这个范围会有两个或更多整数的双精度表示是相同的
      //Math.pow(2,53) === Math.pow(2,53) + 1
      var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
      //调用上面的property方法，得到一个获取对象长度的函数
      var getLength = property('length');
      //内部函数，判断对象是否是类数组，就是通过判断对象有没有length属性，并且length属性的值在正常的范围（0~ Math.pow(2, 53) - 1）
      var isArrayLike = function (collection) {
          var length = getLength(collection);
          return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
      };
  
      // Collection Functions
      // --------------------
  
      // The cornerstone, an `each` implementation, aka `forEach`.
      // Handles raw objects in addition to array-likes. Treats all
      // sparse array-likes as if they were dense.
      _.each = _.forEach = function (obj, iteratee, context) {
          // 将iteratee的this绑定为context
          iteratee = optimizeCb(iteratee, context);
          var i, length;
          //如果是类数组的，就处理obj里面的每个值
          if (isArrayLike(obj)) {
              for (i = 0, length = obj.length; i < length; i++) {
                  iteratee(obj[i], i, obj);
              }
          } else {
              var keys = _.keys(obj);
              //如果是对象，先将对象的key取出来遍历，处理获取到的value
              for (i = 0, length = keys.length; i < length; i++) {
                  iteratee(obj[keys[i]], keys[i], obj);
              }
          }
          return obj;
      };
  
      _.map = _.collect = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          //如果是类数组，则keys就是false 否则就获取对象的key的集合
          var keys = !isArrayLike(obj) && _.keys(obj),
              //获取对象的length
              length = (keys || obj).length,
              //新建一个同样长度的数组
              results = Array(length);
          for (var index = 0; index < length; index++) {
              //如果是数组就获取下标，对象就获取key
              var currentKey = keys ? keys[index] : index;
              //将处理后的结果放到数组中
              results[index] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
      };
  
      function createReduce(dir) {
          //内部函数，遍历对象，用传入的方法处理
          function iterator(obj, iteratee, memo, keys, index, length) {
              for (; index >= 0 && index < length; index += dir) {
                  var currentKey = keys ? keys[index] : index;
                  //iteratee方法的第三个参数为数组的下标或者对象的key
                  memo = iteratee(memo, obj[currentKey], currentKey, obj);
              }
              return memo;
          }
  
          return function (obj, iteratee, memo, context) {
              iteratee = optimizeCb(iteratee, context, 4);
              var keys = !isArrayLike(obj) && _.keys(obj),
                  length = (keys || obj).length,
                  index = dir > 0 ? 0 : length - 1;
              // 如果memo没有传值，就将memo的值设为obj的第一个值或者最后一个值 相应的index加一或者减一
              if (arguments.length < 3) {
                  memo = obj[keys ? keys[index] : index];
                  index += dir;
              }
              //将处理后的结果返回
              return iterator(obj, iteratee, memo, keys, index, length);
          };
      }
  
      _.reduce = _.foldl = _.inject = createReduce(1);
  
      _.reduceRight = _.foldr = createReduce(-1);
  
      // Return the first value which passes a truth test. Aliased as `detect`.
      _.find = _.detect = function (obj, predicate, context) {
          var key;
          if (isArrayLike(obj)) {
              //如果是数组找下标
              key = _.findIndex(obj, predicate, context);
          } else {
              //如果是对象找key
              key = _.findKey(obj, predicate, context);
          }
          //如果找到的key不是undefined也不等于-1则返回这个对象
          if (key !== void 0 && key !== -1) return obj[key];
      };
  
      // Return all the elements that pass a truth test.
      // Aliased as `select`.
      //数组过滤 类似于Array.filter
      _.filter = _.select = function (obj, predicate, context) {
          var results = [];
          //绑定执行上下文
          predicate = cb(predicate, context);
          //遍历数组对象
          _.each(obj, function (value, index, list) {
              //调用传入的方法来过滤
              if (predicate(value, index, list)) results.push(value);
          });
          //返回过滤后的数组
          return results;
      };
  
      // Return all the elements for which a truth test fails.
      //filter 的相反的方法 筛选出没通过的数组
      _.reject = function (obj, predicate, context) {
          //调用filter方法，只是将传入的函数取反
          return _.filter(obj, _.negate(cb(predicate)), context);
      };
  
      // Determine whether all of the elements match a truth test.
      // Aliased as `all`.
      _.every = _.all = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && _.keys(obj),
              length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
              var currentKey = keys ? keys[index] : index;
              if (!predicate(obj[currentKey], currentKey, obj)) return false;
          }
          return true;
      };
  
      // Determine if at least one element in the object matches a truth test.
      // Aliased as `any`.
      _.some = _.any = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = !isArrayLike(obj) && _.keys(obj),
              length = (keys || obj).length;
          for (var index = 0; index < length; index++) {
              var currentKey = keys ? keys[index] : index;
              if (predicate(obj[currentKey], currentKey, obj)) return true;
          }
          return false;
      };
  
      // Determine if the array or object contains a given item (using `===`).
      // Aliased as `includes` and `include`.
      _.contains = _.includes = _.include = function (obj, item, fromIndex, guard) {
          if (!isArrayLike(obj)) obj = _.values(obj);
          if (typeof fromIndex != 'number' || guard) fromIndex = 0;
          return _.indexOf(obj, item, fromIndex) >= 0;
      };
  
      // Invoke a method (with arguments) on every item in a collection.
      _.invoke = function (obj, method) {
          var args = slice.call(arguments, 2);
          var isFunc = _.isFunction(method);
          return _.map(obj, function (value) {
              var func = isFunc ? method : value[method];
              return func == null ? func : func.apply(value, args);
          });
      };
  
      // Convenience version of a common use case of `map`: fetching a property.
      _.pluck = function (obj, key) {
          return _.map(obj, _.property(key));
      };
  
      // Convenience version of a common use case of `filter`: selecting only objects
      // containing specific `key:value` pairs.
      _.where = function (obj, attrs) {
          return _.filter(obj, _.matcher(attrs));
      };
  
      // Convenience version of a common use case of `find`: getting the first object
      // containing specific `key:value` pairs.
      _.findWhere = function (obj, attrs) {
          return _.find(obj, _.matcher(attrs));
      };
  
      // Return the maximum element (or element-based computation).
      _.max = function (obj, iteratee, context) {
          var result = -Infinity, lastComputed = -Infinity,
              value, computed;
          if (iteratee == null && obj != null) {
              obj = isArrayLike(obj) ? obj : _.values(obj);
              for (var i = 0, length = obj.length; i < length; i++) {
                  value = obj[i];
                  if (value > result) {
                      result = value;
                  }
              }
          } else {
              iteratee = cb(iteratee, context);
              _.each(obj, function (value, index, list) {
                  computed = iteratee(value, index, list);
                  if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                      result = value;
                      lastComputed = computed;
                  }
              });
          }
          return result;
      };
  
      // Return the minimum element (or element-based computation).
      _.min = function (obj, iteratee, context) {
          var result = Infinity, lastComputed = Infinity,
              value, computed;
          if (iteratee == null && obj != null) {
              obj = isArrayLike(obj) ? obj : _.values(obj);
              for (var i = 0, length = obj.length; i < length; i++) {
                  value = obj[i];
                  if (value < result) {
                      result = value;
                  }
              }
          } else {
              iteratee = cb(iteratee, context);
              _.each(obj, function (value, index, list) {
                  computed = iteratee(value, index, list);
                  if (computed < lastComputed || computed === Infinity && result === Infinity) {
                      result = value;
                      lastComputed = computed;
                  }
              });
          }
          return result;
      };
  
      // Shuffle a collection, using the modern version of the
      // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
      _.shuffle = function (obj) {
          var set = isArrayLike(obj) ? obj : _.values(obj);
          var length = set.length;
          var shuffled = Array(length);
          for (var index = 0, rand; index < length; index++) {
              rand = _.random(0, index);
              if (rand !== index) shuffled[index] = shuffled[rand];
              shuffled[rand] = set[index];
          }
          return shuffled;
      };
  
      // Sample **n** random values from a collection.
      // If **n** is not specified, returns a single random element.
      // The internal `guard` argument allows it to work with `map`.
      _.sample = function (obj, n, guard) {
          if (n == null || guard) {
              if (!isArrayLike(obj)) obj = _.values(obj);
              return obj[_.random(obj.length - 1)];
          }
          return _.shuffle(obj).slice(0, Math.max(0, n));
      };
  
      // Sort the object's values by a criterion produced by an iteratee.
      _.sortBy = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          return _.pluck(_.map(obj, function (value, index, list) {
              return {
                  value: value,
                  index: index,
                  criteria: iteratee(value, index, list)
              };
          }).sort(function (left, right) {
              var a = left.criteria;
              var b = right.criteria;
              if (a !== b) {
                  if (a > b || a === void 0) return 1;
                  if (a < b || b === void 0) return -1;
              }
              return left.index - right.index;
          }), 'value');
      };
  
      // An internal function used for aggregate "group by" operations.
      var group = function (behavior) {
          return function (obj, iteratee, context) {
              var result = {};
              iteratee = cb(iteratee, context);
              _.each(obj, function (value, index) {
                  var key = iteratee(value, index, obj);
                  behavior(result, value, key);
              });
              return result;
          };
      };
  
      // Groups the object's values by a criterion. Pass either a string attribute
      // to group by, or a function that returns the criterion.
      _.groupBy = group(function (result, value, key) {
          if (_.has(result, key)) result[key].push(value); else result[key] = [value];
      });
  
      // Indexes the object's values by a criterion, similar to `groupBy`, but for
      // when you know that your index values will be unique.
      _.indexBy = group(function (result, value, key) {
          result[key] = value;
      });
  
      // Counts instances of an object that group by a certain criterion. Pass
      // either a string attribute to count by, or a function that returns the
      // criterion.
      _.countBy = group(function (result, value, key) {
          if (_.has(result, key)) result[key]++; else result[key] = 1;
      });
  
      // Safely create a real, live array from anything iterable.
      _.toArray = function (obj) {
          if (!obj) return [];
          if (_.isArray(obj)) return slice.call(obj);
          if (isArrayLike(obj)) return _.map(obj, _.identity);
          return _.values(obj);
      };
  
      // Return the number of elements in an object.
      _.size = function (obj) {
          if (obj == null) return 0;
          return isArrayLike(obj) ? obj.length : _.keys(obj).length;
      };
  
      // Split a collection into two arrays: one whose elements all satisfy the given
      // predicate, and one whose elements all do not satisfy the predicate.
      _.partition = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var pass = [], fail = [];
          _.each(obj, function (value, key, obj) {
              (predicate(value, key, obj) ? pass : fail).push(value);
          });
          return [pass, fail];
      };
  
      // Array Functions
      // ---------------
  
      // Get the first element of an array. Passing **n** will return the first N
      // values in the array. Aliased as `head` and `take`. The **guard** check
      // allows it to work with `_.map`.
      _.first = _.head = _.take = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[0];
          return _.initial(array, array.length - n);
      };
  
      // Returns everything but the last entry of the array. Especially useful on
      // the arguments object. Passing **n** will return all the values in
      // the array, excluding the last N.
      _.initial = function (array, n, guard) {
          return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
      };
  
      // Get the last element of an array. Passing **n** will return the last N
      // values in the array.
      _.last = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[array.length - 1];
          return _.rest(array, Math.max(0, array.length - n));
      };
  
      // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
      // Especially useful on the arguments object. Passing an **n** will return
      // the rest N values in the array.
      _.rest = _.tail = _.drop = function (array, n, guard) {
          return slice.call(array, n == null || guard ? 1 : n);
      };
  
      // Trim out all falsy values from an array.
      _.compact = function (array) {
          return _.filter(array, _.identity);
      };
  
      // Internal implementation of a recursive `flatten` function.
      var flatten = function (input, shallow, strict, startIndex) {
          var output = [], idx = 0;
          for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
              var value = input[i];
              if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
                  //flatten current level of array or arguments object
                  if (!shallow) value = flatten(value, shallow, strict);
                  var j = 0, len = value.length;
                  output.length += len;
                  while (j < len) {
                      output[idx++] = value[j++];
                  }
              } else if (!strict) {
                  output[idx++] = value;
              }
          }
          return output;
      };
  
      // Flatten out an array, either recursively (by default), or just one level.
      _.flatten = function (array, shallow) {
          return flatten(array, shallow, false);
      };
  
      // Return a version of the array that does not contain the specified value(s).
      _.without = function (array) {
          return _.difference(array, slice.call(arguments, 1));
      };
  
      // Produce a duplicate-free version of the array. If the array has already
      // been sorted, you have the option of using a faster algorithm.
      // Aliased as `unique`.
      _.uniq = _.unique = function (array, isSorted, iteratee, context) {
          if (!_.isBoolean(isSorted)) {
              context = iteratee;
              iteratee = isSorted;
              isSorted = false;
          }
          if (iteratee != null) iteratee = cb(iteratee, context);
          var result = [];
          var seen = [];
          for (var i = 0, length = getLength(array); i < length; i++) {
              var value = array[i],
                  computed = iteratee ? iteratee(value, i, array) : value;
              if (isSorted) {
                  if (!i || seen !== computed) result.push(value);
                  seen = computed;
              } else if (iteratee) {
                  if (!_.contains(seen, computed)) {
                      seen.push(computed);
                      result.push(value);
                  }
              } else if (!_.contains(result, value)) {
                  result.push(value);
              }
          }
          return result;
      };
  
      // Produce an array that contains the union: each distinct element from all of
      // the passed-in arrays.
      _.union = function () {
          return _.uniq(flatten(arguments, true, true));
      };
  
      // Produce an array that contains every item shared between all the
      // passed-in arrays.
      _.intersection = function (array) {
          var result = [];
          var argsLength = arguments.length;
          for (var i = 0, length = getLength(array); i < length; i++) {
              var item = array[i];
              if (_.contains(result, item)) continue;
              for (var j = 1; j < argsLength; j++) {
                  if (!_.contains(arguments[j], item)) break;
              }
              if (j === argsLength) result.push(item);
          }
          return result;
      };
  
      // Take the difference between one array and a number of other arrays.
      // Only the elements present in just the first array will remain.
      _.difference = function (array) {
          var rest = flatten(arguments, true, true, 1);
          return _.filter(array, function (value) {
              return !_.contains(rest, value);
          });
      };
  
      // Zip together multiple lists into a single array -- elements that share
      // an index go together.
      _.zip = function () {
          return _.unzip(arguments);
      };
  
      // Complement of _.zip. Unzip accepts an array of arrays and groups
      // each array's elements on shared indices
      _.unzip = function (array) {
          var length = array && _.max(array, getLength).length || 0;
          var result = Array(length);
  
          for (var index = 0; index < length; index++) {
              result[index] = _.pluck(array, index);
          }
          return result;
      };
  
      // Converts lists into objects. Pass either a single array of `[key, value]`
      // pairs, or two parallel arrays of the same length -- one of keys, and one of
      // the corresponding values.
      _.object = function (list, values) {
          var result = {};
          for (var i = 0, length = getLength(list); i < length; i++) {
              if (values) {
                  result[list[i]] = values[i];
              } else {
                  result[list[i][0]] = list[i][1];
              }
          }
          return result;
      };
  
      // Generator function to create the findIndex and findLastIndex functions
      function createPredicateIndexFinder(dir) {
          return function (array, predicate, context) {
              predicate = cb(predicate, context);
              var length = getLength(array);
              var index = dir > 0 ? 0 : length - 1;
              for (; index >= 0 && index < length; index += dir) {
                  if (predicate(array[index], index, array)) return index;
              }
              return -1;
          };
      }
  
      // Returns the first index on an array-like that passes a predicate test
      _.findIndex = createPredicateIndexFinder(1);
      _.findLastIndex = createPredicateIndexFinder(-1);
  
      // Use a comparator function to figure out the smallest index at which
      // an object should be inserted so as to maintain order. Uses binary search.
      _.sortedIndex = function (array, obj, iteratee, context) {
          iteratee = cb(iteratee, context, 1);
          var value = iteratee(obj);
          var low = 0, high = getLength(array);
          while (low < high) {
              var mid = Math.floor((low + high) / 2);
              if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
          }
          return low;
      };
  
      // Generator function to create the indexOf and lastIndexOf functions
      function createIndexFinder(dir, predicateFind, sortedIndex) {
          return function (array, item, idx) {
              var i = 0, length = getLength(array);
              if (typeof idx == 'number') {
                  if (dir > 0) {
                      i = idx >= 0 ? idx : Math.max(idx + length, i);
                  } else {
                      length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
                  }
              } else if (sortedIndex && idx && length) {
                  idx = sortedIndex(array, item);
                  return array[idx] === item ? idx : -1;
              }
              if (item !== item) {
                  idx = predicateFind(slice.call(array, i, length), _.isNaN);
                  return idx >= 0 ? idx + i : -1;
              }
              for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                  if (array[idx] === item) return idx;
              }
              return -1;
          };
      }
  
      // Return the position of the first occurrence of an item in an array,
      // or -1 if the item is not included in the array.
      // If the array is large and already in sort order, pass `true`
      // for **isSorted** to use binary search.
      _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
      _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);
  
      // Generate an integer Array containing an arithmetic progression. A port of
      // the native Python `range()` function. See
      // [the Python documentation](http://docs.python.org/library/functions.html#range).
      _.range = function (start, stop, step) {
          if (stop == null) {
              stop = start || 0;
              start = 0;
          }
          step = step || 1;
  
          var length = Math.max(Math.ceil((stop - start) / step), 0);
          var range = Array(length);
  
          for (var idx = 0; idx < length; idx++ , start += step) {
              range[idx] = start;
          }
  
          return range;
      };
  
      // Function (ahem) Functions
      // ------------------
  
      // Determines whether to execute a function as a constructor
      // or a normal function with the provided arguments
      var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {
          if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
          var self = baseCreate(sourceFunc.prototype);
          var result = sourceFunc.apply(self, args);
          if (_.isObject(result)) return result;
          return self;
      };
  
      // Create a function bound to a given object (assigning `this`, and arguments,
      // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
      // available.
      _.bind = function (func, context) {
          if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
          if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
          var args = slice.call(arguments, 2);
          var bound = function () {
              return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
          };
          return bound;
      };
  
      // Partially apply a function by creating a version that has had some of its
      // arguments pre-filled, without changing its dynamic `this` context. _ acts
      // as a placeholder, allowing any combination of arguments to be pre-filled.
      _.partial = function (func) {
          var boundArgs = slice.call(arguments, 1);
          var bound = function () {
              var position = 0, length = boundArgs.length;
              var args = Array(length);
              for (var i = 0; i < length; i++) {
                  args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
              }
              while (position < arguments.length) args.push(arguments[position++]);
              return executeBound(func, bound, this, this, args);
          };
          return bound;
      };
  
      // Bind a number of an object's methods to that object. Remaining arguments
      // are the method names to be bound. Useful for ensuring that all callbacks
      // defined on an object belong to it.
      _.bindAll = function (obj) {
          var i, length = arguments.length, key;
          if (length <= 1) throw new Error('bindAll must be passed function names');
          for (i = 1; i < length; i++) {
              key = arguments[i];
              obj[key] = _.bind(obj[key], obj);
          }
          return obj;
      };
  
      // Memoize an expensive function by storing its results.
      _.memoize = function (func, hasher) {
          var memoize = function (key) {
              var cache = memoize.cache;
              var address = '' + (hasher ? hasher.apply(this, arguments) : key);
              if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
              return cache[address];
          };
          memoize.cache = {};
          return memoize;
      };
  
      // Delays a function for the given number of milliseconds, and then calls
      // it with the arguments supplied.
      _.delay = function (func, wait) {
          //slice(begin)从起始位置开始copy
          //就是指如果传入func喝wait以外的多个参数的时候，将其他的参数赋值给args
          var args = slice.call(arguments, 2);
          //延时多少时间后调用方法
          return setTimeout(function () {
              //调用方法时将传进去的多个参数传递给func使用
              return func.apply(null, args);
          }, wait);
      };
  
      // Defers a function, scheduling it to run after the current call stack has
      // cleared.
      _.defer = _.partial(_.delay, _, 1);
  
      // Returns a function, that, when invoked, will only be triggered at most once
      // during a given window of time. Normally, the throttled function will run
      // as much as it can, without ever going more than once per `wait` duration;
      // but if you'd like to disable the execution on the leading edge, pass
      // `{leading: false}`. To disable execution on the trailing edge, ditto.
      _.throttle = function (func, wait, options) {
          var context, args, result;
          var timeout = null;
          var previous = 0;
          if (!options) options = {};
          var later = function () {
              previous = options.leading === false ? 0 : _.now();
              timeout = null;
              result = func.apply(context, args);
              if (!timeout) context = args = null;
          };
          return function () {
              var now = _.now();
              if (!previous && options.leading === false) previous = now;
              var remaining = wait - (now - previous);
              context = this;
              args = arguments;
              if (remaining <= 0 || remaining > wait) {
                  if (timeout) {
                      clearTimeout(timeout);
                      timeout = null;
                  }
                  previous = now;
                  result = func.apply(context, args);
                  if (!timeout) context = args = null;
              } else if (!timeout && options.trailing !== false) {
                  timeout = setTimeout(later, remaining);
              }
              return result;
          };
      };
  
      // Returns a function, that, as long as it continues to be invoked, will not
      // be triggered. The function will be called after it stops being called for
      // N milliseconds. If `immediate` is passed, trigger the function on the
      // leading edge, instead of the trailing.
      //函数防抖 func要传入的方法 wait等待时间（毫秒数），immediate是否立即执行
      _.debounce = function (func, wait, immediate) {
          var timeout, args, context, timestamp, result;
  
          var later = function () {
              //计算已经过去了多少时间
              var last = _.now() - timestamp;
              //如果等待时间小于传入的等待时间
              if (last < wait && last >= 0) {
                  //递归调用，wait期望的时间减去已经等待了的时间
                  timeout = setTimeout(later, wait - last);
              } else {
                  //清空定时任务
                  timeout = null;
                  //判断是否是立即执行，如果是立即执行的话就不走这一段逻辑
                  if (!immediate) {
                      //绑定上下文
                      result = func.apply(context, args);
                      //清空已经绑定的上下文
                      if (!timeout) context = args = null;
                  }
              }
          };
  
          return function () {
              //绑定函数的this指向
              context = this;
              //绑定传入的参数
              args = arguments;
              //更新当前时间
              timestamp = _.now();
              //立即触发需要满足两个条件immediate 并且首次触发
              //只要settimeout了timeout就不会为空，就可以判断是否是首次触发
              var callNow = immediate && !timeout;
              if (!timeout) timeout = setTimeout(later, wait);
              //如果是立即触发，执行func并将this的指向和对象的参数传进来
              if (callNow) {
                  result = func.apply(context, args);
                  //清空执行上下文，防止再次传入的时候污染变量
                  context = args = null;
              }
              //返回结果
              return result;
          };
      };
  
      // Returns the first function passed as an argument to the second,
      // allowing you to adjust arguments, run code before and after, and
      // conditionally execute the original function.
      _.wrap = function (func, wrapper) {
          return _.partial(wrapper, func);
      };
  
      // Returns a negated version of the passed-in predicate.
      //返回一个函数和传入的函数得到相反的结果 !predicate
      _.negate = function (predicate) {
          return function () {
              return !predicate.apply(this, arguments);
          };
      };
  
      // Returns a function that is the composition of a list of functions, each
      // consuming the return value of the function that follows.
      _.compose = function () {
          var args = arguments;
          var start = args.length - 1;
          return function () {
              var i = start;
              var result = args[start].apply(this, arguments);
              while (i--) result = args[i].call(this, result);
              return result;
          };
      };
  
      // Returns a function that will only be executed on and after the Nth call.
      _.after = function (times, func) {
          return function () {
              if (--times < 1) {
                  return func.apply(this, arguments);
              }
          };
      };
  
      // Returns a function that will only be executed up to (but not including) the Nth call.
      _.before = function (times, func) {
          var memo;
          return function () {
              if (--times > 0) {
                  memo = func.apply(this, arguments);
              }
              if (times <= 1) func = null;
              return memo;
          };
      };
  
      // Returns a function that will be executed at most one time, no matter how
      // often you call it. Useful for lazy initialization.
      _.once = _.partial(_.before, 2);
  
      // Object Functions
      // ----------------
  
      // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
      var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
      var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
          'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
  
      function collectNonEnumProps(obj, keys) {
          var nonEnumIdx = nonEnumerableProps.length;
          var constructor = obj.constructor;
          var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;
  
          // Constructor is a special case.
          var prop = 'constructor';
          if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);
  
          while (nonEnumIdx--) {
              prop = nonEnumerableProps[nonEnumIdx];
              if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
                  keys.push(prop);
              }
          }
      }
  
      // Retrieve the names of an object's own properties.
      // Delegates to **ECMAScript 5**'s native `Object.keys`
      _.keys = function (obj) {
          if (!_.isObject(obj)) return [];
          if (nativeKeys) return nativeKeys(obj);
          var keys = [];
          for (var key in obj) if (_.has(obj, key)) keys.push(key);
          // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
      };
  
      // Retrieve all the property names of an object.
      _.allKeys = function (obj) {
          if (!_.isObject(obj)) return [];
          var keys = [];
          for (var key in obj) keys.push(key);
          // Ahem, IE < 9.
          if (hasEnumBug) collectNonEnumProps(obj, keys);
          return keys;
      };
  
      // Retrieve the values of an object's properties.
      _.values = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          var values = Array(length);
          for (var i = 0; i < length; i++) {
              values[i] = obj[keys[i]];
          }
          return values;
      };
  
      // Returns the results of applying the iteratee to each element of the object
      // In contrast to _.map it returns an object
      _.mapObject = function (obj, iteratee, context) {
          iteratee = cb(iteratee, context);
          var keys = _.keys(obj),
              length = keys.length,
              results = {},
              currentKey;
          for (var index = 0; index < length; index++) {
              currentKey = keys[index];
              results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
          }
          return results;
      };
  
      // Convert an object into a list of `[key, value]` pairs.
      _.pairs = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          //创建一个长度为对象长度的数组
          //快速创建一个[1,2,3,4...]这样的数组的方法
          //Array(length).fill('').map((i,k) => k+1)
          var pairs = Array(length);
          for (var i = 0; i < length; i++) {
              pairs[i] = [keys[i], obj[keys[i]]];
          }
          return pairs;
      };
  
      // Invert the keys and values of an object. The values must be serializable.
      //将对象的key喝value调换位置
      _.invert = function (obj) {
          var result = {};
          //取出对象的key值的集合
          var keys = _.keys(obj);
          //遍历key值
          for (var i = 0, length = keys.length; i < length; i++) {
              //result.value = key
              result[obj[keys[i]]] = keys[i];
          }
          return result;
      };
  
      // Return a sorted list of the function names available on the object.
      // Aliased as `methods`
      _.functions = _.methods = function (obj) {
          var names = [];
          //将传进来的对象里面的所有value为function的提取出来并排序
          for (var key in obj) {
              if (_.isFunction(obj[key])) names.push(key);
          }
          return names.sort();
      };
  
      // Extend a given object with all the properties in passed-in object(s).
      _.extend = createAssigner(_.allKeys);
  
      // Assigns a given object with all the own properties in the passed-in object(s)
      // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
      //类似于Object.assign()的用法
      _.extendOwn = _.assign = createAssigner(_.keys);
  
      // Returns the first key on an object that passes a predicate test
      _.findKey = function (obj, predicate, context) {
          predicate = cb(predicate, context);
          var keys = _.keys(obj), key;
          for (var i = 0, length = keys.length; i < length; i++) {
              key = keys[i];
              if (predicate(obj[key], key, obj)) return key;
          }
      };
  
      // Return a copy of the object only containing the whitelisted properties.
      _.pick = function (object, oiteratee, context) {
          var result = {}, obj = object, iteratee, keys;
          if (obj == null) return result;
          if (_.isFunction(oiteratee)) {
              keys = _.allKeys(obj);
              iteratee = optimizeCb(oiteratee, context);
          } else {
              keys = flatten(arguments, false, false, 1);
              iteratee = function (value, key, obj) {
                  return key in obj;
              };
              obj = Object(obj);
          }
          for (var i = 0, length = keys.length; i < length; i++) {
              var key = keys[i];
              var value = obj[key];
              if (iteratee(value, key, obj)) result[key] = value;
          }
          return result;
      };
  
      // Return a copy of the object without the blacklisted properties.
      _.omit = function (obj, iteratee, context) {
          if (_.isFunction(iteratee)) {
              iteratee = _.negate(iteratee);
          } else {
              var keys = _.map(flatten(arguments, false, false, 1), String);
              iteratee = function (value, key) {
                  return !_.contains(keys, key);
              };
          }
          return _.pick(obj, iteratee, context);
      };
  
      // Fill in a given object with default properties.
      _.defaults = createAssigner(_.allKeys, true);
  
      // Creates an object that inherits from the given prototype object.
      // If additional properties are provided then they will be added to the
      // created object.
      _.create = function (prototype, props) {
          var result = baseCreate(prototype);
          if (props) _.extendOwn(result, props);
          return result;
      };
  
      // Create a (shallow-cloned) duplicate of an object.
      _.clone = function (obj) {
          if (!_.isObject(obj)) return obj;
          return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
      };
  
      // Invokes interceptor with the obj, and then returns obj.
      // The primary purpose of this method is to "tap into" a method chain, in
      // order to perform operations on intermediate results within the chain.
      _.tap = function (obj, interceptor) {
          interceptor(obj);
          return obj;
      };
  
      // Returns whether an object has a given set of `key:value` pairs.
      _.isMatch = function (object, attrs) {
          var keys = _.keys(attrs), length = keys.length;
          //如果object 为null，则判断attrs的length是否为0，
          //如果为0或者为undefined，则判断attrs也不存在，则两个相匹配
          if (object == null) return !length;
          var obj = Object(object);
          for (var i = 0; i < length; i++) {
              var key = keys[i];
              //如果两者对应的key的value不同，或者Object 没有这个key则返回false
              if (attrs[key] !== obj[key] || !(key in obj)) return false;
          }
          return true;
      };
  
  
      // Internal recursive comparison function for `isEqual`.
      var eq = function (a, b, aStack, bStack) {
          // Identical objects are equal. `0 === -0`, but they aren't identical.
          // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
          //+0 === -0 是true js的1/-0和1/0分别对应的是-Infinity和Infinity
          if (a === b) return a !== 0 || 1 / a === 1 / b;
          // A strict comparison is necessary because `null == undefined`.
          //null == undefinied
          if (a == null || b == null) return a === b;
          // Unwrap any wrapped objects.
          //因为a._wrapped 是a的实例
          if (a instanceof _) a = a._wrapped;
          if (b instanceof _) b = b._wrapped;
          // Compare `[[Class]]` names.
          var className = toString.call(a);
          //如果两个元素的基本类型不符合直接就是false
          if (className !== toString.call(b)) return false;
          switch (className) {
              // Strings, numbers, regular expressions, dates, and booleans are compared by value.
              //正则和String都可以转换成String然后做比较
              case '[object RegExp]':
              // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
              case '[object String]':
                  // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                  // equivalent to `new String("5")`.
                  return '' + a === '' + b;
              case '[object Number]':
                  // `NaN`s are equivalent, but non-reflexive.
                  // Object(NaN) is equivalent to NaN
                  //NaN也是number类型，但不等于自身
                  if (+a !== +a) return +b !== +b;
                  // An `egal` comparison is performed for other numeric values.
                  //排除+-0的情况
                  return +a === 0 ? 1 / +a === 1 / b : +a === +b;
              case '[object Date]':
              case '[object Boolean]':
                  // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                  // millisecond representations. Note that invalid dates with millisecond representations
                  // of `NaN` are not equivalent.
                  //+时间类型会转换成毫秒数
                  //布尔类型这么判断是因为new Boolean() 即不等于true也不等于false
                  return +a === +b;
          }
  
          var areArrays = className === '[object Array]';
          if (!areArrays) {
              //如果不是对象类型 比如说function，就直接不比了
              if (typeof a != 'object' || typeof b != 'object') return false;
  
              // Objects with different constructors are not equivalent, but `Object`s or `Array`s
              // from different frames are.
              //判断a和b的构造函数是否相同
              //TODO
              var aCtor = a.constructor, bCtor = b.constructor;
              if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                  _.isFunction(bCtor) && bCtor instanceof bCtor)
                  && ('constructor' in a && 'constructor' in b)) {
                  return false;
              }
          }
          // Assume equality for cyclic structures. The algorithm for detecting cyclic
          // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  
          // Initializing stack of traversed objects.
          // It's done here since we only need them for objects and arrays comparison.
          aStack = aStack || [];
          bStack = bStack || [];
          var length = aStack.length;
          while (length--) {
              // Linear search. Performance is inversely proportional to the number of
              // unique nested structures.
              //如果递归调用的时候出现过，并且以后走到这里了，说明之前的元素判断过是相等的，则只要判断相同位置的b是否相等
              //缓存减少开销
              if (aStack[length] === a) return bStack[length] === b;
          }
  
          // Add the first object to the stack of traversed objects.
          //做缓存用
          aStack.push(a);
          bStack.push(b);
  
          // Recursively compare objects and arrays.
          if (areArrays) {
              // Compare array lengths to determine if a deep comparison is necessary.
              //数组判断
              length = a.length;
              if (length !== b.length) return false;
              // Deep compare the contents, ignoring non-numeric properties.
              while (length--) {
                  //递归调用
                  if (!eq(a[length], b[length], aStack, bStack)) return false;
              }
          } else {
              // Deep compare objects.
              //剩下一种object类型
              var keys = _.keys(a), key;
              //判断object的key的长度是否相等
              length = keys.length;
              // Ensure that both objects contain the same number of properties before comparing deep equality.
              if (_.keys(b).length !== length) return false;
              while (length--) {
                  // Deep compare each member
                  key = keys[length];
                  //判断b里面是否有a的这个key，并且判断对应的value是否相等
                  if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
              }
          }
          // Remove the first object from the stack of traversed objects.
          //如果以上类型都不匹配
          //清除缓存
          aStack.pop();
          bStack.pop();
          return true;
      };
  
      // Perform a deep comparison to check if two objects are equal.
      //判断对象是否相等
      _.isEqual = function (a, b) {
          return eq(a, b);
      };
  
      // Is a given array, string, or object empty?
      // An "empty" object has no enumerable own-properties.
      _.isEmpty = function (obj) {
          //如果对象是空则返回true
          if (obj == null) return true;
          //如果对象有length属性（Array,String,和内置对象arguments）则判断对象长度是否为0
          if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
          //如果是对象{key:value}则把对象的key取出来判断key的长度是否为0
          return _.keys(obj).length === 0;
      };
  
      // Is a given value a DOM element?
      //判断是否是dom元素
      // const unsigned short      ELEMENT_NODE                   = 1;   元素节点
      // const unsigned short      ATTRIBUTE_NODE                 = 2;   属性节点
      // const unsigned short      TEXT_NODE                      = 3;   文本节点
      // const unsigned short      CDATA_SECTION_NODE             = 4;   CDATA 区段
      // const unsigned short      ENTITY_REFERENCE_NODE          = 5;   实体引用元素
      // const unsigned short      ENTITY_NODE                    = 6;   实体
      // const unsigned short      PROCESSING_INSTRUCTION_NODE    = 7;   表示处理指令
      // const unsigned short      COMMENT_NODE                   = 8;   注释节点
      // const unsigned short      DOCUMENT_NODE                  = 9;   最外层的Root element,包括所有其它节点
      // const unsigned short      DOCUMENT_TYPE_NODE             = 10;   <!DOCTYPE………..>
      // const unsigned short      DOCUMENT_FRAGMENT_NODE         = 11;   文档碎片节点
      // const unsigned short      NOTATION_NODE                  = 12;   DTD 中声明的符号节点
      _.isElement = function (obj) {
          return !!(obj && obj.nodeType === 1);
      };
  
      // Is a given value an array?
      // Delegates to ECMA5's native Array.isArray
      //判断是否是数组，优先使用浏览器原生方法
      _.isArray = nativeIsArray || function (obj) {
          return toString.call(obj) === '[object Array]';
      };
  
      // Is a given variable an object?
      _.isObject = function (obj) {
          var type = typeof obj;
          //判断是否为对象，这里的对象包括Function和Object，但是不包括null typeof null === 'Object' 但是 !!null === false
          return type === 'function' || type === 'object' && !!obj;
      };
  
      // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
      //用于判断是否是其他类型 Object.prototype.toString.call 这样可以返回对象的实际类型
      _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function (name) {
          _['is' + name] = function (obj) {
              return toString.call(obj) === '[object ' + name + ']';
          };
      });
  
      // Define a fallback version of the method in browsers (ahem, IE < 9), where
      // there isn't any inspectable "Arguments" type.
      if (!_.isArguments(arguments)) {
          _.isArguments = function (obj) {
              return _.has(obj, 'callee');
          };
      }
  
      // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
      // IE 11 (#1621), and in Safari 8 (#1929).
      //老的v8和IE 11，Safari 8的bug
      if (typeof /./ != 'function' && typeof Int8Array != 'object') {
          //判断对象是否是函数
          _.isFunction = function (obj) {
              return typeof obj == 'function' || false;
          };
      }
  
      // Is a given object a finite number?
      //判断是否是一个有限数字
      _.isFinite = function (obj) {
          return isFinite(obj) && !isNaN(parseFloat(obj));
      };
  
      // Is the given value `NaN`? (NaN is the only number which does not equal itself).
      _.isNaN = function (obj) {
          //NaN有一个很明显的特征就是不等于自身
          return _.isNumber(obj) && obj !== +obj;
      };
  
      // Is a given value a boolean?
      _.isBoolean = function (obj) {
          //为了检测new Boolean()，new Boolean()即不为true也不为false
          return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
      };
  
      // Is a given value equal to null?
      //判断对象是否是null 这里用===是因为null == undefinied
      _.isNull = function (obj) {
          return obj === null;
      };
  
      // Is a given variable undefined?
      _.isUndefined = function (obj) {
          ///这里用void 0 代替undefined 因为undefined在低版本的ie和局部作用域中能被重写
          return obj === void 0;
      };
  
      // Shortcut function for checking if an object has a given property directly
      // on itself (in other words, not on a prototype).
      _.has = function (obj, key) {
          //调用原生的Object.prototype.hasOwnProperty
          return obj != null && hasOwnProperty.call(obj, key);
      };
  
      // Utility Functions
      // -----------------
  
      // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
      // previous owner. Returns a reference to the Underscore object.
      _.noConflict = function () {
          root._ = previousUnderscore;
          return this;
      };
  
      // Keep the identity function around for default iteratees.
      //返回与传入参数相等的值. 相当于数学里的: f(x) = x
      // 这个函数看似无用, 但是在Underscore里被用作默认的迭代器iterator.
      _.identity = function (value) {
          return value;
      };
  
      // Predicate-generating functions. Often useful outside of Underscore.
      //创建一个函数，这个函数 返回相同的值 用来作为_.constant的参数。
      _.constant = function (value) {
          return function () {
              return value;
          };
      };
  
      //空函数
      //还有一个内置的空函数是Ctor
      _.noop = function () {
      };
  
      _.property = property;
  
      // Generates a function for a given object that returns a given property.
      //传入一个对象，返回一个函数，功能就是根据key返回这个对象的value
      _.propertyOf = function (obj) {
          return obj == null ? function () {
          } : function (key) {
              return obj[key];
          };
      };
  
      // Returns a predicate for checking whether an object has a given set of
      // `key:value` pairs.
      _.matcher = _.matches = function (attrs) {
  
          attrs = _.extendOwn({}, attrs);
          return function (obj) {
              return _.isMatch(obj, attrs);
          };
      };
  
      // Run a function **n** times.
      _.times = function (n, iteratee, context) {
          var accum = Array(Math.max(0, n));
          //绑定iteratee上下文
          iteratee = optimizeCb(iteratee, context, 1);
          //运行iteratee n次，并将运行结果保存到数组中返回
          for (var i = 0; i < n; i++) accum[i] = iteratee(i);
          return accum;
      };
  
      // Return a random integer between min and max (inclusive).
      //随机数，左闭右开
      _.random = function (min, max) {
          if (max == null) {
              max = min;
              min = 0;
          }
          return min + Math.floor(Math.random() * (max - min + 1));
      };
  
      // A (possibly faster) way to get the current timestamp as an integer.
      //返回当前时间戳，毫秒数
      _.now = Date.now || function () {
          return new Date().getTime();
      };
  
      // List of HTML entities for escaping.
      var escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '`': '&#x60;'
      };
      var unescapeMap = _.invert(escapeMap);
  
      // Functions for escaping and unescaping strings to/from HTML interpolation.
      var createEscaper = function (map) {
          var escaper = function (match) {
              return map[match];
          };
          // Regexes for identifying a key that needs to be escaped
          var source = '(?:' + _.keys(map).join('|') + ')';
          var testRegexp = RegExp(source);
          var replaceRegexp = RegExp(source, 'g');
          return function (string) {
              string = string == null ? '' : '' + string;
              return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
          };
      };
      _.escape = createEscaper(escapeMap);
      _.unescape = createEscaper(unescapeMap);
  
      // If the value of the named `property` is a function then invoke it with the
      // `object` as context; otherwise, return it.
      //返回object的property ，如果object.property不是function，则返回该属性，如果不存在，则返回fallback，如果该属性是方法，就将该方法的this指向object
      _.result = function (object, property, fallback) {
          var value = object == null ? void 0 : object[property];
          if (value === void 0) {
              value = fallback;
          }
          return _.isFunction(value) ? value.call(object) : value;
      };
  
      // Generate a unique integer id (unique within the entire client session).
      // Useful for temporary DOM ids.
      var idCounter = 0;
      _.uniqueId = function (prefix) {
          var id = ++idCounter + '';
          return prefix ? prefix + id : id;
      };
  
      // By default, Underscore uses ERB-style template delimiters, change the
      // following template settings to use alternative delimiters.
      _.templateSettings = {
          evaluate: /<%([\s\S]+?)%>/g,
          interpolate: /<%=([\s\S]+?)%>/g,
          escape: /<%-([\s\S]+?)%>/g
      };
  
      // When customizing `templateSettings`, if you don't want to define an
      // interpolation, evaluation or escaping regex, we need one that is
      // guaranteed not to match.
      var noMatch = /(.)^/;
  
      // Certain characters need to be escaped so that they can be put into a
      // string literal.
      var escapes = {
          "'": "'",
          '\\': '\\',
          '\r': 'r',
          '\n': 'n',
          '\u2028': 'u2028',
          '\u2029': 'u2029'
      };
  
      var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
  
      var escapeChar = function (match) {
          return '\\' + escapes[match];
      };
  
      // JavaScript micro-templating, similar to John Resig's implementation.
      // Underscore templating handles arbitrary delimiters, preserves whitespace,
      // and correctly escapes quotes within interpolated code.
      // NB: `oldSettings` only exists for backwards compatibility.
      _.template = function (text, settings, oldSettings) {
          if (!settings && oldSettings) settings = oldSettings;
          settings = _.defaults({}, settings, _.templateSettings);
  
          // Combine delimiters into one regular expression via alternation.
          var matcher = RegExp([
              (settings.escape || noMatch).source,
              (settings.interpolate || noMatch).source,
              (settings.evaluate || noMatch).source
          ].join('|') + '|$', 'g');
  
          // Compile the template source, escaping string literals appropriately.
          var index = 0;
          var source = "__p+='";
          text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
              source += text.slice(index, offset).replace(escaper, escapeChar);
              index = offset + match.length;
  
              if (escape) {
                  source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
              } else if (interpolate) {
                  source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
              } else if (evaluate) {
                  source += "';\n" + evaluate + "\n__p+='";
              }
  
              // Adobe VMs need the match returned to produce the correct offest.
              return match;
          });
          source += "';\n";
  
          // If a variable is not specified, place data values in local scope.
          if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
  
          source = "var __t,__p='',__j=Array.prototype.join," +
              "print=function(){__p+=__j.call(arguments,'');};\n" +
              source + 'return __p;\n';
  
          try {
              var render = new Function(settings.variable || 'obj', '_', source);
          } catch (e) {
              e.source = source;
              throw e;
          }
  
          var template = function (data) {
              return render.call(this, data, _);
          };
  
          // Provide the compiled source as a convenience for precompilation.
          var argument = settings.variable || 'obj';
          template.source = 'function(' + argument + '){\n' + source + '}';
  
          return template;
      };
  
      // Add a "chain" function. Start chaining a wrapped Underscore object.
      _.chain = function (obj) {
          var instance = _(obj);
          instance._chain = true;
          return instance;
      };
  
      // OOP
      // ---------------
      // If Underscore is called as a function, it returns a wrapped object that
      // can be used OO-style. This wrapper holds altered versions of all the
      // underscore functions. Wrapped objects may be chained.
  
      // Helper function to continue chaining intermediate results.
      var result = function (instance, obj) {
          return instance._chain ? _(obj).chain() : obj;
      };
  
      // Add your own custom functions to the Underscore object.
      _.mixin = function (obj) {
          _.each(_.functions(obj), function (name) {
              var func = _[name] = obj[name];
              _.prototype[name] = function () {
                  var args = [this._wrapped];
                  push.apply(args, arguments);
                  return result(this, func.apply(_, args));
              };
          });
      };
  
      // Add all of the Underscore functions to the wrapper object.
      _.mixin(_);
  
      // Add all mutator Array functions to the wrapper.
      _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
              var obj = this._wrapped;
              method.apply(obj, arguments);
              if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
              return result(this, obj);
          };
      });
  
      // Add all accessor Array functions to the wrapper.
      _.each(['concat', 'join', 'slice'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
              return result(this, method.apply(this._wrapped, arguments));
          };
      });
  
      // Extracts the result from a wrapped and chained object.
      //返回underscore实例
      _.prototype.value = function () {
          return this._wrapped;
      };
  
      // Provide unwrapping proxy for some methods used in engine operations
      // such as arithmetic and JSON stringification.
      _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;
  
      _.prototype.toString = function () {
          return '' + this._wrapped;
      };
  
      // AMD registration happens at the end for compatibility with AMD loaders
      // that may not enforce next-turn semantics on modules. Even though general
      // practice for AMD registration is to be anonymous, underscore registers
      // as a named module because, like jQuery, it is a base library that is
      // popular enough to be bundled in a third party lib, but not be part of
      // an AMD load request. Those cases could generate an error when an
      // anonymous define() is called outside of a loader request.
      if (typeof define === 'function' && define.amd) {
          define('underscore', [], function () {
              return _;
          });
      }
  }.call(this));
  