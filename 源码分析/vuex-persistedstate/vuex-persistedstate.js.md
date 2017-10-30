### api
#### `createPersistedState([options])`

/ Creates a new instance of the plugin with the given options. The following options can be provided to configure the plugin for your specific needs:

* `key <String>`: The key to store the persisted state under. (default: vuex)

* `paths <Array>`: An array of any paths to partially persist the state. If no paths are given, the complete state is persisted. (default: [])

* `reducer <Function>`: A function that will be called to reduce the state to persist based on the given paths. Defaults to include the values.

* `subscriber <Function>`: A function called to setup mutation subscription. Defaults to store => handler => store.subscribe(handler)

* `storage <Storage>`: Instead for (or in combination with) getState and setState. Defaults to localStorage.

* `getState <Function>`: A function that will be called to rehydrate a previously persisted state. Defaults to using storage.

* `setState <Function>`: A function that will be called to persist the given state. Defaults to using storage.

* filter <Function>: A function that will be called to filter any mutations which will trigger setState on storage eventually. Defaults to` () => true`

