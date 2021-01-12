
class WindowRegistry {
  constructor(logHandler, windowListUi) {
    this.logHandler = logHandler;
    this.windowListUi = windowListUi;
    this.windowNames = new Set();
    this.update();

    document.getElementById('update_window_list').onclick = this.update.bind(this);
    document.getElementById('window_open_devtools').onclick = this.openDevTools.bind(this);
  }

  openDevTools() {
    const windowName = this.windowListUi.getSelectedItemId();    
    fin.Application.getCurrentSync().getInfo().then(info => {
      fin.System.showDeveloperTools({name: windowName, uuid: info.initialOptions.uuid});
    });
    
  }

  formatWindowName(isMain, windowName) {
    let type = 'child';
    if (isMain) {
      type = 'main';
    }
    return `[${type}] ${windowName}`;
  }

  onUpdated(windowInfoArray) {
    this.clearWindows();
    console.warn('updated');
    for (const info of windowInfoArray) {
      this.addWindow(info.mainWindow.name, this.formatWindowName(true, info.mainWindow.name));
      for (const childWindow of info.childWindows) {
        this.addWindow(childWindow.name, this.formatWindowName(false, childWindow.name));
      }
    }
  }

  update() {
    console.warn('update start')
    fin.System.getAllWindows().then((result) => this.onUpdated.bind(this)(result));
  }  

  onWindowCreated(windowName) {
    console.log(`WindowRegistry.onWindowCreated ${windowName}`);
    this.addWindow(windowName, this.formatWindowName(false, windowName));
  }

  onWindowClosing(windowName) {
    this.removeWindow(windowName);
  }

  addWindow(windowName, desc) {
    console.warn(`WindowRegistry.onWindowAdded ${windowName}`);
    this.windowNames.add(windowName);
    this.windowListUi.onWindowAdded(windowName, desc);
  }

  removeWindow(windowName) {
    this.windowNames.delete(windowName);
    this.windowListUi.onWindowRemoved(windowName);
  }

  clearWindows() {
    for (const windowName of this.windowNames) {
      this.removeWindow(windowName);
    }
  }
};

class LogHandler {
  constructor(uiHandler) {
    this.uiHandler = uiHandler;
    this.logElement = document.getElementById('log');
  }

  addLog(line) {
    if (typeof line === 'object') {
      line = JSON.stringify(line, null, 2);
    }
    this.logElement.textContent = `${line}\n${document.getElementById('log').textContent}`;
  }  

};

class ListUi {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
  }

  addItem(id, itemText) {
    var option = document.createElement("option");
    option.id = id;
    option.text = itemText;
    this.element.add(option);
  }

  removeItem(id) {
    const index = this.getItemIndexById(id);
    console.assert(index);
    this.element.remove(index);
  }

  getSelectedItemId() {
    if (-1 === this.element.selectedIndex) {
      return null;
    }
    return this.element.options[this.element.selectedIndex].id;
  }

  getItemById(id) {

  }

  setItemClass(id, newClass) {
    console.warn(document.querySelector(`#${id}`));
    document.querySelector(`#${id}`).classList.add(newClass);
  }

  resetItemClass(id, newClass) {
    console.warn(document.querySelector(`#${id}`));
    document.querySelector(`#${id}`).classList.remove(newClass);
  }

  getItemIndexById(id) {
    let index = 0;
    let found = false;
    for (const item of this.element.options) {      
      if (item.id == id) {
        found = true;
        break;
      }
      index++;
    }
    if (found) {
      return index;
    }
    return null;
  }
}

class FocusTracker {
  constructor(windowListUi) {
    this.windowListUi = windowListUi;
  }

  onWindowFocused(windowName) {
    console.warn(`focus ${windowName}`);
    this.windowListUi.setItemClass(windowName, 'focusedwindow');
  }

  onWindowBlurred(windowName) {
    console.warn(`blur ${windowName}`);
    this.windowListUi.resetItemClass(windowName, 'focusedwindow');
  }


}

class WindowListUi extends ListUi {
  constructor() {
    super('window_list');
  }

  onWindowAdded(windowName, windowDesc) {
    this.addItem(windowName, windowDesc);
  }

  onWindowRemoved(windowName) {
    this.removeItem(windowName);
  }
}

class UiHandler {
  constructor(app) {
    this.app = app;
  }  

  bindButton(buttonId, callback) {
    document.getElementById(buttonId).onclick = callback;
  }  

};

class DiagnosticApp {
  constructor() {
    this.lastIndex = 0;
    this.app = fin.Application.getCurrentSync();
    this.uiHandler = new UiHandler(this);
    this.logHandler = new LogHandler(this.uiHandler);
    this.windowListUi = new WindowListUi();
    this.windowRegistry = new WindowRegistry(this.logHandler, this.windowListUi);
    this.focusTracker = new FocusTracker(this.windowListUi);

    this.uiHandler.bindButton('btn_open_new_window', this.openNewWindow.bind(this));
    //this.uiHandler.bindButton('update_window_list', this.windowRegistry.update.bind(this.windowRegistry));

    this.hookApplicationEvents();    

    //this.logHandler.addLog(`Application created ${JSON.stringify(this.app.identity)}`);
  }

  openNewWindow() {
    const newUuid = `child${++this.lastIndex}`;
    const winOption = {
      name: `${newUuid}`,
      //uuid: newUuid,
      //defaultWidth: 300,
      //defaultHeight: 300,
      //waitForPageLoad: false,
      url: `https://www.example.com/${this.lastIndex}`,
      //frame: true,
      autoShow: true,
      waitForPageLoad: false,
    };

    fin.Window.create(winOption);

    //const winOption = {name: `child-window-${Date.now()}`, url: "https://www.example.com", autoShow: true, backgroundColor: "#FF0000", waitForPageLoad: false};
    /*
    */
    
    //new fin.desktop.Window(winOption).then(w => {w.show();});
  }

  makeUuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  onHookFired(name, event) {    
    if (name == 'window-created') {
      this.windowRegistry.onWindowCreated(event.name);
    } else if (name == 'window-closing') {
      this.windowRegistry.onWindowClosing(event.name);
    } else if (name == 'window-focused') {
      this.focusTracker.onWindowFocused(event.name);
    } else if (name == 'window-blurred') {
      this.focusTracker.onWindowBlurred(event.name);
    } else {
      let targetName = '??';
      if (event && event.name) {
        targetName = event.name;
      }
      this.logHandler.addLog(`${name} ${targetName}`);
    }
  }

  hookApplicationEvents() {
    let kEventNames = new Array();
    kEventNames.push('closed');
    kEventNames.push('connected');
    kEventNames.push('crashed');
    kEventNames.push('initialized');
    kEventNames.push('manifest-changed');
    kEventNames.push('not-responding');
    kEventNames.push('responding');
    kEventNames.push('run-requested');
    kEventNames.push('started');
    kEventNames.push('tray-icon-clicked');
    kEventNames.push('window-alert-requested');
    kEventNames.push('window-auth-requested');
    kEventNames.push('window-blurred');
    kEventNames.push('window-bounds-changed');
    kEventNames.push('window-bounds-changing');
    kEventNames.push('window-certificate-selection-shown');
    kEventNames.push('window-closed');
    kEventNames.push('window-closing');
    kEventNames.push('window-crashed');
    kEventNames.push('window-created');
    kEventNames.push('window-did-change-theme-color');
    kEventNames.push('window-disabled-movement-bounds-changed');
    kEventNames.push('window-disabled-movement-bounds-changing');
    kEventNames.push('window-embedded');
    kEventNames.push('window-end-load');
    kEventNames.push('window-external-process-exited');
    kEventNames.push('window-external-process-started');
    kEventNames.push('window-file-download-completed');
    kEventNames.push('window-file-download-progress');
    kEventNames.push('window-file-download-started');
    kEventNames.push('window-focused');
    kEventNames.push('window-group-changed');
    kEventNames.push('window-hidden');
    kEventNames.push('window-initialized');
    kEventNames.push('window-maximized');
    kEventNames.push('window-minimized');
    kEventNames.push('window-options-changed');
    kEventNames.push('window-navigation-rejected');
    kEventNames.push('window-not-responding');
    kEventNames.push('window-page-favicon-updated');
    kEventNames.push('window-page-title-updated');
    kEventNames.push('window-performance-report');
    kEventNames.push('window-preload-scripts-state-changed');
    kEventNames.push('window-preload-scripts-state-changing');
    kEventNames.push('window-reloaded');
    kEventNames.push('window-resource-load-failed');
    kEventNames.push('window-resource-response-received');
    kEventNames.push('window-responding');
    kEventNames.push('window-restored');
    //kEventNames.push('window-show-requested');
    kEventNames.push('window-shown');
    kEventNames.push('window-start-load');
    kEventNames.push('window-user-movement-disabled');
    kEventNames.push('window-user-movement-enabled');
    kEventNames.push('window-will-move');
    kEventNames.push('window-will-resize');
    kEventNames.push('view-attached');
    kEventNames.push('view-certificate-selection-shown');
    kEventNames.push('view-crashed');
    kEventNames.push('view-created');
    kEventNames.push('view-destroyed');
    kEventNames.push('view-detached');
    kEventNames.push('view-did-change-theme-color');
    kEventNames.push('view-file-download-completed');
    kEventNames.push('view-file-download-progress');
    kEventNames.push('view-file-download-started');
    kEventNames.push('view-hidden');
    kEventNames.push('view-page-favicon-updated');
    kEventNames.push('view-page-title-updated');
    kEventNames.push('view-resource-load-failed');
    kEventNames.push('view-resource-response-received');
    kEventNames.push('view-shown');

    for (const name of kEventNames) {
      this.app.addListener(name, this.onHookFired.bind(this, name));
    }
  }
};
