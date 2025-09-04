const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Папка где будут лежать ваши файлы
const FILES_DIR = path.join(__dirname, 'pages');

// Создаем папку pages если её нет
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR);
    console.log('Создана папка "pages" для ваших HTML файлов');
}

// Middleware для статических файлов
app.use('/pages', express.static(FILES_DIR));
app.use('/static', express.static('static')); // для CSS, JS, изображений

// Функция для получения всех HTML файлов
function getHtmlFiles(dir) {
    const files = [];
    
    function scanDir(currentDir, relativePath = '') {
        const items = fs.readdirSync(currentDir);
        
        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const relativeFullPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Рекурсивно сканируем подпапки
                scanDir(fullPath, relativeFullPath);
            } else if (path.extname(item).toLowerCase() === '.html') {
                const stats = fs.statSync(fullPath);
                files.push({
                    name: item,
                    path: relativeFullPath.replace(/\\/g, '/'), // для Windows
                    fullPath: fullPath,
                    size: stats.size,
                    modified: stats.mtime,
                    folder: relativePath || 'root'
                });
            }
        });
    }
    
    scanDir(dir);
    return files;
}

// Главная страница - каталог файлов
app.get('/', (req, res) => {
    const htmlFiles = getHtmlFiles(FILES_DIR);
    
    // Группируем файлы по папкам
    const filesByFolder = {};
    htmlFiles.forEach(file => {
        if (!filesByFolder[file.folder]) {
            filesByFolder[file.folder] = [];
        }
        filesByFolder[file.folder].push(file);
    });
    
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Каталог файлов</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px;
                margin-bottom: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
            }
            .header p {
                margin: 10px 0 0 0;
                opacity: 0.9;
            }
            .stats {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin-top: 20px;
            }
            .stat {
                text-align: center;
            }
            .stat-number {
                font-size: 1.8em;
                font-weight: bold;
            }
            .folder-section {
                background: white;
                margin-bottom: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .folder-header {
                background: #4f46e5;
                color: white;
                padding: 15px 20px;
                font-weight: bold;
                font-size: 1.1em;
            }
            .files-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                padding: 20px;
            }
            .file-card {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                background: #fefefe;
                transition: all 0.2s ease;
                text-decoration: none;
                color: inherit;
            }
            .file-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                border-color: #4f46e5;
            }
            .file-name {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
                word-break: break-word;
            }
            .file-meta {
                font-size: 0.85em;
                color: #6b7280;
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #6b7280;
            }
            .empty-state h3 {
                margin-bottom: 10px;
                color: #374151;
            }
            .refresh-btn {
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 20px;
                transition: background 0.2s;
            }
            .refresh-btn:hover {
                background: #059669;
            }
            .instructions {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
                border-left: 4px solid #10b981;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📚 Каталог файлов</h1>
            <p>Конспекты ок ок</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${htmlFiles.length}</div>
                    <div>файлов</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${Object.keys(filesByFolder).length}</div>
                    <div>папок</div>
                </div>
            </div>
        </div>


        ${htmlFiles.length === 0 ? `
            <div class="empty-state">
                <h3>🗂️ Пока что здесь пусто</h3>
                <p>Добавьте HTML файлы в папку <strong>pages/</strong> чтобы они появились здесь</p>
                <button class="refresh-btn" onclick="window.location.reload()">🔄 Обновить</button>
            </div>
        ` : `
            ${Object.keys(filesByFolder).map(folder => `
                <div class="folder-section">
                    <div class="folder-header">
                        📁 ${folder === 'root' ? 'Корневая папка' : folder}
                    </div>
                    <div class="files-grid">
                        ${filesByFolder[folder].map(file => `
                            <a href="/pages/${file.path}" class="file-card" target="_blank">
                                <div class="file-name">📄 ${file.name}</div>
                                <div class="file-meta">
                                    <span>${(file.size / 1024).toFixed(1)} KB</span>
                                    <span>${file.modified.toLocaleDateString('ru-RU')}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            <div style="text-align: center; margin-top: 30px;">
                <button class="refresh-btn" onclick="window.location.reload()">🔄 Обновить каталог</button>
            </div>
        `}
    </body>
    </html>
    `;
    
    res.send(html);
});

// API для получения списка файлов (если понадобится)
app.get('/api/files', (req, res) => {
    const htmlFiles = getHtmlFiles(FILES_DIR);
    res.json(htmlFiles);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Папка для файлов: ${FILES_DIR}`);
    console.log(`💡 Добавляйте HTML файлы в папку "pages" и они автоматически появятся в каталоге`);
});

// Обработка закрытия
process.on('SIGINT', () => {
    console.log('\n👋 Сервер остановлен');
    process.exit(0);
});