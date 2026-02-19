import { Plugin, PluginContext, TabId } from './types';
import { TabManager } from './TabManager';

export class PluginManager {
  private plugins: Plugin[] = [];
  private tabManager: TabManager;
  private ctx: PluginContext;
  private activeTab: TabId = 'explore';
  private pluginsByTab = new Map<TabId, Plugin[]>();

  constructor(container: HTMLElement, ctx: PluginContext) {
    this.ctx = ctx;
    this.tabManager = new TabManager(container, (tab) => this.onTabSwitch(tab));
  }

  register(plugin: Plugin): void {
    this.plugins.push(plugin);

    if (!this.pluginsByTab.has(plugin.tab)) {
      this.pluginsByTab.set(plugin.tab, []);
    }
    this.pluginsByTab.get(plugin.tab)!.push(plugin);
  }

  init(): void {
    // Sort plugins within each tab by order
    for (const [, plugins] of this.pluginsByTab) {
      plugins.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    }

    // Init all plugins — they all get containers and run init()
    for (const plugin of this.plugins) {
      const container = this.tabManager.createPluginContainer(plugin.tab);
      plugin.init(container, this.ctx);
    }

    // Activate plugins on the initial tab
    const initialPlugins = this.pluginsByTab.get(this.activeTab) ?? [];
    for (const p of initialPlugins) {
      p.activate?.();
    }
  }

  private onTabSwitch(newTab: TabId): void {
    // Deactivate old tab's plugins
    const oldPlugins = this.pluginsByTab.get(this.activeTab) ?? [];
    for (const p of oldPlugins) {
      p.deactivate?.();
    }

    this.activeTab = newTab;

    // Activate new tab's plugins
    const newPlugins = this.pluginsByTab.get(newTab) ?? [];
    for (const p of newPlugins) {
      p.activate?.();
    }
  }

  destroy(): void {
    for (const plugin of this.plugins) {
      plugin.destroy?.();
    }
    this.plugins = [];
    this.pluginsByTab.clear();
  }
}
