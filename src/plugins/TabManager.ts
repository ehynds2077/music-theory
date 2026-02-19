import { TabId } from './types';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'view', label: 'View' },
  { id: 'play', label: 'Play' },
  { id: 'export', label: 'Export' },
];

export class TabManager {
  private panels = new Map<TabId, HTMLElement>();
  private buttons = new Map<TabId, HTMLElement>();
  private activeTab: TabId = 'explore';
  private onSwitch: (tab: TabId) => void;

  constructor(container: HTMLElement, onSwitch: (tab: TabId) => void) {
    this.onSwitch = onSwitch;

    // Tab bar
    const bar = document.createElement('div');
    bar.className = 'tab-bar';

    for (const tab of TABS) {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (tab.id === this.activeTab ? ' tab-active' : '');
      btn.textContent = tab.label;
      btn.addEventListener('click', () => this.switchTo(tab.id));
      bar.appendChild(btn);
      this.buttons.set(tab.id, btn);
    }

    container.appendChild(bar);

    // Panels
    for (const tab of TABS) {
      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.style.display = tab.id === this.activeTab ? 'flex' : 'none';
      container.appendChild(panel);
      this.panels.set(tab.id, panel);
    }
  }

  getPanel(tab: TabId): HTMLElement {
    return this.panels.get(tab)!;
  }

  createPluginContainer(tab: TabId): HTMLElement {
    const el = document.createElement('div');
    el.className = 'plugin-container';
    this.panels.get(tab)!.appendChild(el);
    return el;
  }

  private switchTo(tab: TabId): void {
    if (tab === this.activeTab) return;

    const prevTab = this.activeTab;
    this.activeTab = tab;

    // Update buttons
    this.buttons.get(prevTab)!.classList.remove('tab-active');
    this.buttons.get(tab)!.classList.add('tab-active');

    // Update panels
    this.panels.get(prevTab)!.style.display = 'none';
    this.panels.get(tab)!.style.display = 'flex';

    this.onSwitch(tab);
  }
}
