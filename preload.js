
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Generic CRUD
  getAll: (tableName) => ipcRenderer.invoke('db:getAll', tableName),
  getById: (tableName, id) => ipcRenderer.invoke('db:getById', tableName, id),
  getTableCount: (tableName) => ipcRenderer.invoke('db:getTableCount', tableName),
  insert: (tableName, data) => ipcRenderer.invoke('db:insert', tableName, data),
  update: (tableName, id, data) => ipcRenderer.invoke('db:update', tableName, id, data),
  delete: (tableName, id) => ipcRenderer.invoke('db:delete', tableName, id),

  // Specific queries
  getUserByUsername: (username) => ipcRenderer.invoke('db:getUserByUsername', username),
  getSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
  updateSetting: (key, value) => ipcRenderer.invoke('db:updateSetting', key, value),
  getPaymentsByClientId: (clientId) => ipcRenderer.invoke('db:getPaymentsByClientId', clientId),
  getDocumentsByClientId: (clientId) => ipcRenderer.invoke('db:getDocumentsByClientId', clientId),
  getAttendancesByClientId: (clientId) => ipcRenderer.invoke('db:getAttendancesByClientId', clientId),
  
  // Transactions
  deleteClientAndRelations: (clientId) => ipcRenderer.invoke('db:deleteClientAndRelations', clientId),
  wipeTransactionalData: () => ipcRenderer.invoke('db:wipeTransactionalData'),
  
  // Backup & Restore
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore'),
});
