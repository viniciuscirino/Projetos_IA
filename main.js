
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// --- Database Setup ---
const dbPath = path.join(app.getPath('userData'), 'sindicato.sqlite');
let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log(`Database opened successfully at ${dbPath}`);
        initializeDatabase();
    }
});

const run = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.error('Error running query', query, params, err);
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

const get = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, result) => {
            if (err) {
                console.error('Error running query', query, params, err);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const all = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error running query', query, params, err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const initializeDatabase = async () => {
    await run(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT, nomeCompleto TEXT, cpf TEXT UNIQUE, rg TEXT, endereco TEXT, telefone TEXT, email TEXT, dataFiliacao TEXT, status TEXT, foto TEXT, createdAt TEXT, updatedAt TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER, referencia TEXT, dataPagamento TEXT, valor REAL, createdAt TEXT, registeredBy TEXT, UNIQUE(clientId, referencia)
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS declarations (
            id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER, dataEmissao TEXT, createdAt TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT, category TEXT, amount REAL, date TEXT, createdAt TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER, name TEXT, type TEXT, content BLOB, createdAt TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY, value TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT, createdAt TEXT
        );`);
    await run(`
        CREATE TABLE IF NOT EXISTS attendances (
            id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER, notes TEXT, createdAt TEXT, createdBy TEXT
        );`);

    // --- Seed initial data if tables are new ---
    const userCount = await get("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
        console.log("Seeding initial data...");
        const now = new Date().toISOString();
        await run("INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)", ['admin', 'admin', 'admin', now]);
        await run("INSERT INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)", ['vinicius', 'user', 'user', now]);
        
        const settings = [
            { key: 'syndicateName', value: 'SINDICATO DOS TRABALHADORES RURAIS DE INDIAROBA' },
            { key: 'syndicateCnpj', value: '00.000.000/0001-00' },
            { key: 'syndicateAddress', value: 'Rua da Sede, nº 123, Centro, Indiaroba/SE, CEP 49250-000' },
            { key: 'syndicatePhone', value: '(79) 99999-9999' },
            { key: 'declarationTemplate', value: `<p>Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, portador(a) do RG nº {{RG}} e inscrito(a) no CPF sob o nº {{CPF}}, encontra-se regularmente filiado(a) a esta entidade sindical, na qualidade de membro associado(a) desde {{DATA_FILIACAO}}.</p><p>Declaramos ainda que, até a presente data, não constam em nossos registros quaisquer fatos que desabonem sua condição de associado(a).</p><p>Por ser expressão da verdade, firmamos a presente declaração.</p>` },
            { key: 'paymentDeclarationTemplate', value: `<p>Declaramos, para os devidos fins, que o(a) Sr(a). {{NOME_ASSOCIADO}}, inscrito(a) no CPF sob o nº {{CPF}}, associado(a) desta entidade, encontra-se em dia com suas obrigações financeiras, tendo o último pagamento registrado referente à competência de <b>{{MES_ULTIMO_PAGAMENTO}} de {{ANO_ULTIMO_PAGAMENTO}}</b>.</p><p>Por ser expressão da verdade, firmamos a presente declaração.</p>` },
            { key: 'syndicateSignature', value: '' }
        ];
        for (const s of settings) {
            await run("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, JSON.stringify(s.value)]);
        }
    }
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --- IPC Handlers ---

ipcMain.handle('db:getAll', (_, tableName) => all(`SELECT * FROM ${tableName}`));
ipcMain.handle('db:getById', (_, tableName, id) => get(`SELECT * FROM ${tableName} WHERE id = ?`, [id]));
ipcMain.handle('db:getTableCount', (_, tableName) => get(`SELECT COUNT(*) as count FROM ${tableName}`).then(res => res.count));

ipcMain.handle('db:insert', async (_, tableName, data) => {
    const columns = Object.keys(data).join(',');
    const placeholders = Object.keys(data).map(() => '?').join(',');
    const values = Object.values(data);
    const result = await run(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`, values);
    return result.id;
});

ipcMain.handle('db:update', (_, tableName, id, data) => {
    const columns = Object.keys(data).map(key => `${key} = ?`).join(',');
    const values = [...Object.values(data), id];
    return run(`UPDATE ${tableName} SET ${columns} WHERE id = ?`, values);
});

ipcMain.handle('db:delete', (_, tableName, id) => run(`DELETE FROM ${tableName} WHERE id = ?`, [id]));

// Specific queries
ipcMain.handle('db:getUserByUsername', (_, username) => get('SELECT * FROM users WHERE username = ?', [username]));

ipcMain.handle('db:getSetting', async (_, key) => {
    const setting = await get('SELECT value FROM settings WHERE key = ?', [key]);
    if (setting) {
        try {
            return JSON.parse(setting.value);
        } catch {
            return setting.value;
        }
    }
    return undefined;
});

ipcMain.handle('db:updateSetting', (_, key, value) => {
    return run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
});

ipcMain.handle('db:getPaymentsByClientId', (_, clientId) => all('SELECT * FROM payments WHERE clientId = ?', [clientId]));
ipcMain.handle('db:getDocumentsByClientId', (_, clientId) => all('SELECT * FROM documents WHERE clientId = ? ORDER BY createdAt DESC', [clientId]));
ipcMain.handle('db:getAttendancesByClientId', (_, clientId) => all('SELECT * FROM attendances WHERE clientId = ? ORDER BY createdAt DESC', [clientId]));

// Transactions
ipcMain.handle('db:deleteClientAndRelations', async (_, clientId) => {
    await run('BEGIN TRANSACTION');
    try {
        await run('DELETE FROM payments WHERE clientId = ?', [clientId]);
        await run('DELETE FROM declarations WHERE clientId = ?', [clientId]);
        await run('DELETE FROM documents WHERE clientId = ?', [clientId]);
        await run('DELETE FROM attendances WHERE clientId = ?', [clientId]);
        await run('DELETE FROM clients WHERE id = ?', [clientId]);
        await run('COMMIT');
        return true;
    } catch (e) {
        await run('ROLLBACK');
        throw e;
    }
});

ipcMain.handle('db:wipeTransactionalData', async () => {
    await run('BEGIN TRANSACTION');
    try {
        await run('DELETE FROM clients');
        await run('DELETE FROM payments');
        await run('DELETE FROM declarations');
        await run('DELETE FROM expenses');
        await run('DELETE FROM documents');
        await run('DELETE FROM attendances');
        await run('COMMIT');
        return true;
    } catch (e) {
        await run('ROLLBACK');
        throw e;
    }
});

// Backup & Restore
ipcMain.handle('db:backup', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Salvar Backup do Banco de Dados',
        defaultPath: `sindicato_backup_${new Date().toISOString().slice(0, 10)}.sqlite`,
        filters: [{ name: 'SQLite Files', extensions: ['sqlite', 'db'] }]
    });

    if (canceled || !filePath) {
        return { success: false, message: 'Backup cancelado.' };
    }

    try {
        // Close current DB connection, copy file, then reopen.
        await new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve()));
        fs.copyFileSync(dbPath, filePath);
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) throw err;
        });
        return { success: true };
    } catch (error) {
        console.error('Backup failed:', error);
        // Re-open DB even if copy fails
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error("Failed to re-open DB after failed backup:", err);
        });
        return { success: false, message: error.message };
    }
});

ipcMain.handle('db:restore', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Restaurar Backup do Banco de Dados',
        filters: [{ name: 'SQLite Files', extensions: ['sqlite', 'db', 'sqlite3'] }],
        properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, message: 'Restauração cancelada.' };
    }

    const backupPath = filePaths[0];
    try {
        // Close current DB, replace file, then reopen.
        await new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve()));
        fs.copyFileSync(backupPath, dbPath);
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) throw err;
        });
        return { success: true };
    } catch (error) {
        console.error('Restore failed:', error);
         // Re-open DB even if copy fails
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) console.error("Failed to re-open DB after failed restore:", err);
        });
        return { success: false, message: error.message };
    }
});
