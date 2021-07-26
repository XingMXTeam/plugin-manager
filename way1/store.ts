import PluginManager from "./pluginManger";

const emptyFunc = (() => {});

const pipe = (...func) => {
  return func.reduce((accumulator, cur) => {
    return (...args) => accumulator(cur(...args))
  }, value => value)
}

const composeMiddlewares = (middleware) => {
  return (store, option, hookPromise) => {
    let index = -1;
    function dispatch(i, ...others) {
      if(i === middleware.length) {
        return hookPromise(...others)
      }
      if(i <= index) {
        return Promise.reject(new Error('next() called multiple times'))
      }
      index = i;
      const fn = middleware[i];
      if(!fn) {
        return dispatch(i+1, ...others)
      }
      try {
        return fn(store, dispatch.bind(null, i+1, ...others), option)
      }catch(err) {
        return Promise.reject(err)
      }
    }
    return dispatch(0);
  }
}

export class Store {
  pluginManager: PluginManager;
  plugins: []
  pluginMap: {

  }
  constructor() {
    this.pluginManager = new PluginManager();
  }
  registerPlugins = (pluginConfigs) => {
    pluginConfigs.forEach((config) => {
      const func =
        typeof config === "function" ? config : this.pluginMap[config.type];
      const plugin = typeof func === "function" ? func(config) : config;
      if (!plugin) return;
      
      // run init
      if (plugin.init) {
        plugin.init();
      }
      this.pluginManager.install({
        pluginName: plugin.name,
        instance: plugin,
      });
    });
  };
  pluginfyMethod = (methodName: string) => {
    const cacheMethod = this[methodName] || emptyFunc
    if(cacheMethod.pluginfied) return
    const getMiddlewares = pipe(
      plugins => plugins.fiter(plugin => plugin[methodName] && typeof plugin[methodName] === 'function'),
      plugins => plugins.map(plugin => plugin[methodName].bind(plugin))
    )
    this[methodName] = new Proxy(cacheMethod, {
      apply: (target, thisBindings, args) => {
        const middleWares = getMiddlewares(this.plugins)
        const dispatch = composeMiddlewares(middleWares)
        return dispatch(this, { args: [...args] }, target.bind(thisBindings, ...args))
      }
    })
  }
}
