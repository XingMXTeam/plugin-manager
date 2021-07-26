export interface IPlugin {
    pluginName: string;
    instance: IPluginInstance;
}

export interface IPluginInstance {
  destroy?: () => void;
  init: (store) => void;
}


export default class PluginManager {
  private plugins: IPlugin[];

  constructor() {
    this.plugins = [];
  }

  install = ({ pluginName, instance }: IPlugin): void => {
    this.plugins.push({
      pluginName,
      instance,
    });
  };

  get = (name: string): IPlugin[] =>
    this.plugins.filter(({ pluginName }) => pluginName === name);

  reset(options: IPlugin[] = []) {
      this.destroyAll();
      options.forEach(option => {
          this.install(option)
      })
  }

  destroyAll() {
      const { plugins } = this
      while(plugins.length) {
          const { instance } = plugins.pop() as IPlugin;
          const { destroy } = instance
          if(typeof destroy === 'function') {
              destroy.apply(instance)
          }
      }
  }
}
