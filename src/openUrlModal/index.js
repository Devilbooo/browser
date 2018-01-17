/** @file Main process setup for "Open URL..." dialog */
const {BrowserWindow, ipcMain, shell} = require('electron');
const path = require('path');
const url = require('url');
const {REQUEST_NAVIGATION, NAVIGATION_REQUESTED} = require('../channelNames');
const {openUrlInDefaultBrowser} = require('../originWhitelist');

let _mainWindow;
function injectMainWindow(mainWindow) {
  _mainWindow = mainWindow;
  showOpenUrlModal(); // TODO: Remove this, only present for debugging
}

function showOpenUrlModal() {
  if (!_mainWindow) {
    throw new Error('A reference to the main window has not been established.');
  }

  const modal = new BrowserWindow({
    width: 360,
    height: 120,
    show: false,
    parent: _mainWindow,
    modal: true,
    autoHideMenuBar: true,
  });

  modal.loadURL(url.format({
    pathname: path.join(__dirname, 'view.html'),
    protocol: 'file:',
    slashes: true,
  }));

  ipcMain.on(REQUEST_NAVIGATION, handleNavigation);
  modal.once('ready-to-show', () => modal.show());
  modal.once('closed', () => {
    ipcMain.removeListener(REQUEST_NAVIGATION, handleNavigation);
  });
}

function handleNavigation(_, url) {
  if (!_mainWindow) {
    throw new Error('A reference to the main window has not been established.');
  }

  if (openUrlInDefaultBrowser(url)) {
    shell.openExternal(url);
  } else {
    _mainWindow.webContents.send(NAVIGATION_REQUESTED, url);
  }
}

module.exports = {
  injectMainWindow,
  showOpenUrlModal,
};
