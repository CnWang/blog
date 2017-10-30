/**
* @license
*
* vuex-persistedstate v2.0.0
*
* (c) 2017 Robin van der Vleuten <robin@webstronauts.co>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/
(function (global, factory) {
  //global的值为{} 不知道什么原因，猜测是检测不同环境node,浏览器等
  //TODO
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash.merge'), require('object-path')) :
      typeof define === 'function' && define.amd ? define(['lodash.merge', 'object-path'], factory) :
          (global.createPersistedState = factory(global.merge, global.objectPath));
}(this, (function (merge, objectPath) {
  'use strict';

  //有疑问
  //TODO
  //判断merge里面是否有default属性
  merge = 'default' in merge ? merge['default'] : merge;
  objectPath = 'default' in objectPath ? objectPath['default'] : objectPath;

  var defaultReducer = function (state, paths) {
      return (paths.length === 0
          ? state
          : paths.reduce(function (substate, path) {
              //调用object-path的库，将pahs中设定的部分需要保留的state字段放入localstorage中
              objectPath.set(substate, path, objectPath.get(state, path));
              return substate;
          }, {}));
  };

  //测试localstorage是否能用
  var canWriteStorage = function (storage) {
      try {
          storage.setItem('_canWriteToLocalStorage', 1);
          storage.removeItem('_canWriteToLocalStorage');
          return true;
      } catch (e) {
          return false;
      }
  };

  function createPersistedState(ref) {
      if (ref === void 0) ref = {};
      var key = ref.key;
      if (key === void 0) key = 'vuex';
      var paths = ref.paths;
      if (paths === void 0) paths = [];
      var getState = ref.getState;
      //获取localstorage里面存的vuex的信息
      if (getState === void 0) getState = function (key, storage) {
          var value = storage.getItem(key);

          try {
              return value && value !== 'undefined' ? JSON.parse(value) : undefined;
          } catch (err) {
              return undefined;
          }
      };
      var  setState = ref.setState;
      //将vuex的对象存储到localstorage中
      if (setState === void 0) setState = function (key, state, storage) {
          return storage.setItem(key, JSON.stringify(state));
      };
      var reducer = ref.reducer;
      if (reducer === void 0) reducer = defaultReducer;
      var storage = ref.storage;
      if (storage === void 0) storage = window && window.localStorage;
      var filter = ref.filter;
      if (filter === void 0) filter = function () {
          return true;
      };
      var subscriber = ref.subscriber;
      //注册监听store的mutation
      if (subscriber === void 0) subscriber = function (store) {
          return function (handler) {
              return store.subscribe(handler);
          };
      };

      //判断浏览器是否支持localstorage
      if (!canWriteStorage(storage)) {
          throw new Error('Invalid storage instance given');
      }

      return function (store) {
          var savedState = getState(key, storage);
          if (typeof savedState === 'object') {
              //调用lodash的merge方法，用localstorage里面的数据将store里面的值覆盖
              store.replaceState(merge({}, store.state, savedState));
          }

          //注册监听store的mutation，并且调用mutation改变state的值
          subscriber(store)(function (mutation, state) {
              //在store/index.js中调用方法并没用传入ref，所以filter(mutation)一直为true
              if (filter(mutation)) {
                  //将store的值传入localstorage
                  setState(key, reducer(state, paths), storage);
              }
          });
      };
  }

  return createPersistedState;

})));
