<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import loader from '@monaco-editor/loader'
import '@mdi/font/css/materialdesignicons.css'
import { sortJSON } from './utils/sortJSON'
import { compareJSON } from './utils/compareJSON'
import { findLineNumber, buildLineNumberMap, pathToString } from './utils/findLineNumber'

// 创建一个简单的事件总线
if (typeof window.eventHub === 'undefined') {
  window.eventHub = {
    events: {},
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data))
      }
    },
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = []
      }
      this.events[event].push(callback)
    },
    off(event, callback) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(cb => cb !== callback)
      }
    }
  }
}

// 检查是否在uTools环境中运行
const isUTools = ref(typeof window.utools !== 'undefined')

const isCompareMode = ref(false)
const leftEditorContainer = ref(null)
const rightEditorContainer = ref(null)
let leftEditor = null
let rightEditor = null
let monaco = null
const leftDecorations = ref([])
const rightDecorations = ref([])
const leftFilePath = ref('')
const rightFilePath = ref('')
const fileChanged = ref(false)

// Toast 通知系统
const toast = ref({
  visible: false,
  message: '',
  type: 'info', // info, success, error
  timeout: null
})

// 显示 Toast 通知
function showToast(message, type = 'info', duration = 3000) {
  // 如果已有通知，先清除计时器
  if (toast.value.timeout) {
    clearTimeout(toast.value.timeout)
  }
  
  // 更新并显示通知
  toast.value.message = message
  toast.value.type = type
  toast.value.visible = true
  
  // 设置自动关闭
  toast.value.timeout = setTimeout(() => {
    hideToast()
  }, duration)
}

// 隐藏 Toast 通知
function hideToast() {
  toast.value.visible = false
}

const leftContent = ref({
  "config": {
    "name": "JSON Compare Demo",
    "version": "1.0.0",
    "description": "A comprehensive example to test JSON diff functionality",
    "author": {
      "name": "Test User",
      "email": "test@example.com",
      "url": "https://example.com"
    },
    "license": "MIT",
    "isProduction": false,
    "debug": true
  },
  "server": {
    "host": "localhost",
    "port": 3000,
    "protocol": "http",
    "timeout": 30000,
    "retryCount": 3,
    "headers": {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "User-Agent": "JSON-Diff-Test"
    }
  },
  "database": {
    "main": {
      "host": "db.example.com",
      "port": 5432,
      "user": "admin",
      "password": "password123",
      "name": "maindb",
      "options": {
        "ssl": true,
        "timeout": 5000,
        "pool": {
          "max": 20,
          "min": 5,
          "idle": 10000
        }
      }
    },
    "replica": {
      "host": "replica.example.com",
      "port": 5432,
      "user": "reader",
      "password": "reader123",
      "name": "maindb-replica",
      "options": {
        "ssl": true,
        "timeout": 3000,
        "pool": {
          "max": 10,
          "min": 2,
          "idle": 10000
        }
      }
    }
  },
  "features": {
    "authentication": {
      "enabled": true,
      "methods": ["local", "oauth", "ldap"],
      "jwt": {
        "secret": "your-secret-key",
        "expiresIn": "1d"
      },
      "oauth": {
        "google": {
          "clientId": "google-client-id",
          "clientSecret": "google-client-secret"
        },
        "github": {
          "clientId": "github-client-id",
          "clientSecret": "github-client-secret"
        }
      }
    },
    "logging": {
      "enabled": true,
      "level": "info",
      "transports": ["console", "file"],
      "format": "json",
      "files": {
        "info": "logs/info.log",
        "error": "logs/error.log",
        "debug": "logs/debug.log"
      }
    },
    "caching": {
      "enabled": true,
      "driver": "redis",
      "ttl": 3600,
      "redis": {
        "host": "cache.example.com",
        "port": 6379,
        "password": "redis-password"
      }
    }
  },
  "api": {
    "endpoints": [
      {
        "path": "/users",
        "method": "GET",
        "auth": true,
        "rate_limit": {
          "max": 100,
          "window": "15m"
        },
        "cache": {
          "enabled": true,
          "ttl": 300
        }
      },
      {
        "path": "/users/:id",
        "method": "GET",
        "auth": true,
        "rate_limit": {
          "max": 200,
          "window": "15m"
        },
        "cache": {
          "enabled": true,
          "ttl": 60
        }
      },
      {
        "path": "/posts",
        "method": "POST",
        "auth": true,
        "rate_limit": {
          "max": 50,
          "window": "15m"
        },
        "cache": {
          "enabled": false
        }
      }
    ],
    "middlewares": [
      "cors",
      "helmet",
      "body-parser",
      "compression",
      "rate-limiter"
    ]
  },
  "tasks": [
    {
      "name": "data-backup",
      "schedule": "0 0 * * *",
      "action": "backup_database",
      "args": {
        "target": "s3://backups.example.com",
        "compress": true
      },
      "retry": {
        "attempts": 3,
        "delay": 300
      }
    },
    {
      "name": "cache-flush",
      "schedule": "0 */6 * * *",
      "action": "flush_cache",
      "args": {
        "full": false
      },
      "retry": {
        "attempts": 2,
        "delay": 60
      }
    }
  ],
  "notifications": {
    "email": {
      "enabled": true,
      "provider": "smtp",
      "smtp": {
        "host": "smtp.example.com",
        "port": 587,
        "secure": true,
        "auth": {
          "user": "notifications@example.com",
          "pass": "smtp-password"
        }
      },
      "templates": {
        "welcome": "templates/email/welcome.html",
        "password-reset": "templates/email/password-reset.html",
        "invoice": "templates/email/invoice.html"
      }
    },
    "push": {
      "enabled": false,
      "provider": "firebase",
      "credentials": {
        "projectId": "example-project-id",
        "privateKey": "firebase-private-key"
      }
    }
  },
  "clients": {
    "mobile": {
      "ios": {
        "minVersion": "1.0.0",
        "currentVersion": "1.2.3",
        "forceUpdate": false
      },
      "android": {
        "minVersion": "1.0.0",
        "currentVersion": "1.2.1",
        "forceUpdate": false
      }
    },
    "web": {
      "supportedBrowsers": [
        "chrome >= 60",
        "firefox >= 60",
        "safari >= 12",
        "edge >= 15"
      ],
      "assets": {
        "baseUrl": "https://cdn.example.com",
        "cacheTime": 86400
      }
    }
  },
  "metrics": {
    "enabled": true,
    "provider": "prometheus",
    "interval": 60,
    "endpoints": {
      "scrape": "/metrics",
      "health": "/health"
    },
    "alerting": {
      "enabled": true,
      "thresholds": {
        "cpu": 80,
        "memory": 90,
        "disk": 85,
        "latency": 500
      }
    }
  },
  "environments": {
    "development": {
      "debug": true,
      "loglevel": "debug",
      "services": {
        "mockEnabled": true
      }
    },
    "testing": {
      "debug": true,
      "loglevel": "info",
      "services": {
        "mockEnabled": true
      }
    },
    "staging": {
      "debug": false,
      "loglevel": "info",
      "services": {
        "mockEnabled": false
      }
    },
    "production": {
      "debug": false,
      "loglevel": "warn",
      "services": {
        "mockEnabled": false
      }
    }
  },
  "constants": {
    "DATE_FORMAT": "YYYY-MM-DD",
    "TIME_FORMAT": "HH:mm:ss",
    "CURRENCY": "USD",
    "LANGUAGES": ["en", "es", "fr", "de", "zh"],
    "TIMEZONE": "UTC",
    "MAX_UPLOAD_SIZE": 10485760,
    "PAGINATION": {
      "DEFAULT_LIMIT": 20,
      "MAX_LIMIT": 100
    }
  }
})

const rightContent = ref({
  "config": {
    "name": "JSON Compare Demo",
    "version": "2.0.0",
    "description": "An improved comprehensive example to test JSON diff functionality",
    "author": {
      "name": "Test User",
      "email": "updated@example.com",
      "url": "https://example.com"
    },
    "license": "Apache-2.0",
    "isProduction": true,
    "debug": false
  },
  "server": {
    "host": "api.example.com",
    "port": 8080,
    "protocol": "https",
    "timeout": 30000,
    "retryCount": 5,
    "headers": {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "User-Agent": "JSON-Diff-Test-v2",
      "Authorization": "Bearer {{token}}"
    }
  },
  "database": {
    "main": {
      "host": "db.example.com",
      "port": 5432,
      "user": "admin",
      "password": "new-secure-password",
      "name": "maindb",
      "options": {
        "ssl": true,
        "timeout": 5000,
        "pool": {
          "max": 30,
          "min": 10,
          "idle": 10000
        }
      }
    },
    "replica": {
      "host": "replica.example.com",
      "port": 5432,
      "user": "reader",
      "password": "reader123",
      "name": "maindb-replica",
      "options": {
        "ssl": true,
        "timeout": 3000,
        "pool": {
          "max": 10,
          "min": 2,
          "idle": 10000
        }
      }
    },
    "analytics": {
      "host": "analytics.example.com",
      "port": 5432,
      "user": "analyst",
      "password": "analyst123",
      "name": "analytics-db",
      "options": {
        "ssl": true,
        "timeout": 10000,
        "pool": {
          "max": 5,
          "min": 1,
          "idle": 30000
        }
      }
    }
  },
  "features": {
    "authentication": {
      "enabled": true,
      "methods": ["local", "oauth", "ldap", "saml"],
      "jwt": {
        "secret": "new-secret-key",
        "expiresIn": "7d"
      },
      "oauth": {
        "google": {
          "clientId": "new-google-client-id",
          "clientSecret": "new-google-client-secret"
        },
        "github": {
          "clientId": "github-client-id",
          "clientSecret": "github-client-secret"
        },
        "facebook": {
          "clientId": "facebook-client-id",
          "clientSecret": "facebook-client-secret"
        }
      }
    },
    "logging": {
      "enabled": true,
      "level": "warn",
      "transports": ["console", "file", "elasticsearch"],
      "format": "json",
      "files": {
        "info": "logs/info.log",
        "error": "logs/error.log",
        "debug": "logs/debug.log",
        "warn": "logs/warn.log"
      }
    },
    "caching": {
      "enabled": true,
      "driver": "redis",
      "ttl": 7200,
      "redis": {
        "host": "cache.example.com",
        "port": 6379,
        "password": "new-redis-password",
        "cluster": true
      }
    },
    "rateLimit": {
      "enabled": true,
      "windowMs": 900000,
      "max": 100
    }
  },
  "api": {
    "endpoints": [
      {
        "path": "/users",
        "method": "GET",
        "auth": true,
        "rate_limit": {
          "max": 150,
          "window": "15m"
        },
        "cache": {
          "enabled": true,
          "ttl": 300
        }
      },
      {
        "path": "/users/:id",
        "method": "GET",
        "auth": true,
        "rate_limit": {
          "max": 200,
          "window": "15m"
        },
        "cache": {
          "enabled": true,
          "ttl": 60
        }
      },
      {
        "path": "/posts",
        "method": "POST",
        "auth": true,
        "rate_limit": {
          "max": 50,
          "window": "15m"
        },
        "cache": {
          "enabled": false
        }
      },
      {
        "path": "/comments",
        "method": "GET",
        "auth": false,
        "rate_limit": {
          "max": 300,
          "window": "15m"
        },
        "cache": {
          "enabled": true,
          "ttl": 120
        }
      }
    ],
    "middlewares": [
      "cors",
      "helmet",
      "body-parser",
      "compression",
      "rate-limiter",
      "jwt-auth"
    ],
    "version": "v2"
  },
  "tasks": [
    {
      "name": "data-backup",
      "schedule": "0 0 * * *",
      "action": "backup_database",
      "args": {
        "target": "s3://backups.example.com",
        "compress": true,
        "encrypt": true
      },
      "retry": {
        "attempts": 3,
        "delay": 300
      }
    },
    {
      "name": "cache-flush",
      "schedule": "0 */4 * * *",
      "action": "flush_cache",
      "args": {
        "full": true
      },
      "retry": {
        "attempts": 2,
        "delay": 60
      }
    },
    {
      "name": "reports-generation",
      "schedule": "0 7 * * 1",
      "action": "generate_reports",
      "args": {
        "type": "weekly",
        "format": "pdf"
      },
      "retry": {
        "attempts": 3,
        "delay": 600
      }
    }
  ],
  "notifications": {
    "email": {
      "enabled": true,
      "provider": "ses",
      "smtp": {
        "host": "smtp.example.com",
        "port": 587,
        "secure": true,
        "auth": {
          "user": "notifications@example.com",
          "pass": "new-smtp-password"
        }
      },
      "templates": {
        "welcome": "templates/email/welcome.html",
        "password-reset": "templates/email/password-reset.html",
        "invoice": "templates/email/invoice.html",
        "verification": "templates/email/verification.html"
      }
    },
    "push": {
      "enabled": true,
      "provider": "firebase",
      "credentials": {
        "projectId": "new-project-id",
        "privateKey": "new-firebase-private-key"
      },
      "topics": [
        "news",
        "updates",
        "promotions"
      ]
    },
    "sms": {
      "enabled": true,
      "provider": "twilio",
      "credentials": {
        "accountSid": "twilio-account-sid",
        "authToken": "twilio-auth-token",
        "phoneNumber": "+15551234567"
      }
    }
  },
  "clients": {
    "mobile": {
      "ios": {
        "minVersion": "1.5.0",
        "currentVersion": "2.0.0",
        "forceUpdate": true
      },
      "android": {
        "minVersion": "1.5.0",
        "currentVersion": "2.0.0",
        "forceUpdate": true
      }
    },
    "web": {
      "supportedBrowsers": [
        "chrome >= 70",
        "firefox >= 70",
        "safari >= 13",
        "edge >= 18",
        "opera >= 60"
      ],
      "assets": {
        "baseUrl": "https://cdn.example.com/v2",
        "cacheTime": 43200
      }
    }
  },
  "metrics": {
    "enabled": true,
    "provider": "datadog",
    "interval": 30,
    "endpoints": {
      "scrape": "/metrics",
      "health": "/health"
    },
    "alerting": {
      "enabled": true,
      "thresholds": {
        "cpu": 75,
        "memory": 85,
        "disk": 80,
        "latency": 300,
        "errors": 5
      },
      "notifyChannels": [
        "email",
        "slack",
        "pagerduty"
      ]
    }
  },
  "environments": {
    "development": {
      "debug": true,
      "loglevel": "debug",
      "services": {
        "mockEnabled": true
      }
    },
    "testing": {
      "debug": true,
      "loglevel": "info",
      "services": {
        "mockEnabled": true
      }
    },
    "staging": {
      "debug": false,
      "loglevel": "info",
      "services": {
        "mockEnabled": false
      }
    },
    "production": {
      "debug": false,
      "loglevel": "warn",
      "services": {
        "mockEnabled": false
      }
    },
    "demo": {
      "debug": false,
      "loglevel": "info",
      "services": {
        "mockEnabled": false
      }
    }
  },
  "constants": {
    "DATE_FORMAT": "YYYY-MM-DD",
    "TIME_FORMAT": "HH:mm:ss",
    "CURRENCY": "EUR",
    "LANGUAGES": ["en", "es", "fr", "de", "zh", "ja", "ru"],
    "TIMEZONE": "UTC",
    "MAX_UPLOAD_SIZE": 20971520,
    "PAGINATION": {
      "DEFAULT_LIMIT": 25,
      "MAX_LIMIT": 200
    },
    "SECURITY": {
      "PASSWORD_MIN_LENGTH": 8,
      "PASSWORD_REQUIRE_LOWERCASE": true,
      "PASSWORD_REQUIRE_UPPERCASE": true,
      "PASSWORD_REQUIRE_NUMBER": true,
      "PASSWORD_REQUIRE_SYMBOL": true
    }
  }
})

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2)
}

// 加载左侧JSON文件
function handleLoadLeftFile() {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  const result = window.selectFile({
    title: '选择左侧JSON文件',
    filters: [{ name: 'JSON文件', extensions: ['json'] }],
    properties: ['openFile']
  })
  
  if (result.success) {
    leftFilePath.value = result.filePath
    const fileResult = window.readJSONFile(result.filePath)
    
    if (fileResult.success) {
      try {
        const jsonContent = JSON.parse(fileResult.content)
        if (leftEditor) {
          leftEditor.setValue(formatJSON(jsonContent))
          fileChanged.value = false
          if (isCompareMode.value && rightEditor) {
            highlightDifferences()
          }
        }
        showToast('已加载左侧JSON文件', 'success')
      } catch (e) {
        showToast('文件内容不是有效的JSON', 'error')
      }
    } else {
      showToast('无法读取文件: ' + fileResult.error, 'error')
    }
  }
}

// 加载右侧JSON文件
function handleLoadRightFile() {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  if (!isCompareMode.value) {
    toggleCompareMode()
  }
  
  const result = window.selectFile({
    title: '选择右侧JSON文件',
    filters: [{ name: 'JSON文件', extensions: ['json'] }],
    properties: ['openFile']
  })
  
  if (result.success) {
    rightFilePath.value = result.filePath
    const fileResult = window.readJSONFile(result.filePath)
    
    if (fileResult.success) {
      try {
        const jsonContent = JSON.parse(fileResult.content)
        if (rightEditor) {
          rightEditor.setValue(formatJSON(jsonContent))
          if (leftEditor) {
            highlightDifferences()
          }
        }
        showToast('已加载右侧JSON文件', 'success')
      } catch (e) {
        showToast('文件内容不是有效的JSON', 'error')
      }
    } else {
      showToast('无法读取文件: ' + fileResult.error, 'error')
    }
  }
}

// 保存左侧编辑器内容
function handleSaveLeftFile() {
  if (!isUTools.value || !leftEditor) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  let filePath = leftFilePath.value
  
  if (!filePath) {
    const result = window.selectFile({
      title: '保存JSON文件',
      filters: [{ name: 'JSON文件', extensions: ['json'] }],
      properties: ['saveFile']
    })
    
    if (result.success) {
      filePath = result.filePath
      leftFilePath.value = filePath
    } else {
      return
    }
  }
  
  try {
    const content = leftEditor.getValue()
    // 检查是否是有效的JSON
    JSON.parse(content)
    
    const saveResult = window.saveJSONFile(filePath, content)
    if (saveResult.success) {
      fileChanged.value = false
      showToast('文件已保存', 'success')
    } else {
      showToast('保存文件失败: ' + saveResult.error, 'error')
    }
  } catch (e) {
    showToast('内容不是有效的JSON，无法保存', 'error')
  }
}

// 保存右侧编辑器内容
function handleSaveRightFile() {
  if (!isUTools.value || !rightEditor) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  let filePath = rightFilePath.value
  
  if (!filePath) {
    const result = window.selectFile({
      title: '保存JSON文件',
      filters: [{ name: 'JSON文件', extensions: ['json'] }],
      properties: ['saveFile']
    })
    
    if (result.success) {
      filePath = result.filePath
      rightFilePath.value = filePath
    } else {
      return
    }
  }
  
  try {
    const content = rightEditor.getValue()
    // 检查是否是有效的JSON
    JSON.parse(content)
    
    const saveResult = window.saveJSONFile(filePath, content)
    if (saveResult.success) {
      showToast('文件已保存', 'success')
    } else {
      showToast('保存文件失败: ' + saveResult.error, 'error')
    }
  } catch (e) {
    showToast('内容不是有效的JSON，无法保存', 'error')
  }
}

function handleFormat() {
  try {
    if (isCompareMode.value) {
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(leftContent))
        fileChanged.value = true
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        rightEditor.setValue(formatJSON(rightContent))
      }
    } else {
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        leftEditor.setValue(formatJSON(content))
        fileChanged.value = true
      }
    }
    showToast('JSON已格式化', 'success')
  } catch (e) {
    console.error('Invalid JSON:', e)
    showToast('无效的JSON格式', 'error')
  }
}

function handleSort() {
  try {
    if (isCompareMode.value) {
      if (leftEditor) {
        const leftContent = JSON.parse(leftEditor.getValue())
        const sortedLeft = sortJSON(leftContent)
        leftEditor.setValue(formatJSON(sortedLeft))
        fileChanged.value = true
      }
      if (rightEditor) {
        const rightContent = JSON.parse(rightEditor.getValue())
        const sortedRight = sortJSON(rightContent)
        rightEditor.setValue(formatJSON(sortedRight))
      }
    } else {
      if (leftEditor) {
        const content = JSON.parse(leftEditor.getValue())
        const sorted = sortJSON(content)
        leftEditor.setValue(formatJSON(sorted))
        fileChanged.value = true
      }
    }
    showToast('JSON已排序', 'success')
  } catch (e) {
    console.error('Invalid JSON:', e)
    showToast('无效的JSON格式', 'error')
  }
}

function handleCopy(side) {
  if (!isUTools.value) {
    console.error('此功能仅在uTools环境中可用')
    return
  }
  
  try {
    let content = ''
    if (side === 'left' && leftEditor) {
      content = leftEditor.getValue()
    } else if (side === 'right' && rightEditor) {
      content = rightEditor.getValue()
    }
    
    if (content) {
      if (window.copyToClipboard) {
        window.copyToClipboard(content)
        showToast('内容已复制到剪贴板', 'success')
      } else if (window.utools) {
        window.utools.copyText(content)
        showToast('内容已复制到剪贴板', 'success')
      } else {
        // 浏览器环境的备用方法
        navigator.clipboard.writeText(content).then(() => {
          showToast('内容已复制到剪贴板', 'success')
        })
      }
    }
  } catch (e) {
    console.error('复制失败:', e)
    showToast('复制失败', 'error')
  }
}

async function initializeMonaco() {
  monaco = await loader.init()
  
  const editorOptions = {
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    renderValidationDecorations: 'on',
    formatOnPaste: true,
    formatOnType: true,
    glyphMargin: true
  }

  leftEditor = monaco.editor.create(leftEditorContainer.value, {
    ...editorOptions,
    value: formatJSON(leftContent.value),
    readOnly: false
  })

  leftEditor.onDidChangeModelContent(() => {
    try {
      if (isCompareMode.value && rightEditor) {
        highlightDifferences()
      }
    } catch (e) {
      console.error('Invalid JSON in left editor')
    }
  })
}

function initializeRightEditor() {
  if (!rightEditorContainer.value || !monaco) return

  rightEditor = monaco.editor.create(rightEditorContainer.value, {
    language: 'json',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    renderValidationDecorations: 'on',
    formatOnPaste: true,
    formatOnType: true,
    value: formatJSON(rightContent.value),
    readOnly: false
  })

  rightEditor.onDidChangeModelContent(() => {
    try {
      highlightDifferences()
    } catch (e) {
      console.error('Invalid JSON in right editor')
    }
  })
  
  setupScrollSync()
}

function setupScrollSync() {
  if (!leftEditor || !rightEditor) return
  
  let isSyncing = false
  
  leftEditor.onDidScrollChange((e) => {
    if (isSyncing) return
    if (!rightEditor) return
    
    isSyncing = true
    
    rightEditor.setScrollTop(e.scrollTop)
    rightEditor.setScrollLeft(e.scrollLeft)
    
    setTimeout(() => {
      isSyncing = false
    }, 100)
  })
}

function highlightDifferences() {
  if (!leftEditor || !rightEditor) return
  
  const leftContent = leftEditor.getValue()
  const rightContent = rightEditor.getValue()
  
  try {
    const leftJson = JSON.parse(leftContent)
    const rightJson = JSON.parse(rightContent)
    
    const differences = compareJSON(leftJson, rightJson)
    
    const leftLineMap = buildLineNumberMap(leftContent)
    const rightLineMap = buildLineNumberMap(rightContent)
    
    leftDecorations.value = leftEditor.deltaDecorations(leftDecorations.value, [])
    rightDecorations.value = rightEditor.deltaDecorations(rightDecorations.value, [])
    
    const leftHighlights = []
    const rightHighlights = []
    
    differences.forEach(diff => {
      const leftLines = findLineNumber(leftContent, diff.path, leftLineMap)
      const rightLines = findLineNumber(rightContent, diff.path, rightLineMap)
      
      if (leftLines.length > 0 && (diff.type === 'removed' || diff.type === 'modified')) {
        leftHighlights.push({
          range: new monaco.Range(
            leftLines[0],
            1,
            leftLines[leftLines.length - 1],
            1
          ),
          options: {
            isWholeLine: true,
            className: diff.type === 'removed' ? 'removed-line' : 'modified-line',
            glyphMarginClassName: diff.type === 'removed' ? 'removed-glyph' : 'modified-glyph',
            hoverMessage: { value: getHoverMessage(diff, 'left') },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        })
      }
      
      if (rightLines.length > 0 && (diff.type === 'added' || diff.type === 'modified')) {
        rightHighlights.push({
          range: new monaco.Range(
            rightLines[0],
            1,
            rightLines[rightLines.length - 1],
            1
          ),
          options: {
            isWholeLine: true,
            className: diff.type === 'added' ? 'added-line' : 'modified-line',
            glyphMarginClassName: diff.type === 'added' ? 'added-glyph' : 'modified-glyph',
            hoverMessage: { value: getHoverMessage(diff, 'right') },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        })
      }
    })
    
    leftDecorations.value = leftEditor.deltaDecorations([], leftHighlights)
    rightDecorations.value = rightEditor.deltaDecorations([], rightHighlights)
    
  } catch (error) {
    console.error('Error parsing JSON:', error)
  }
}

function getHoverMessage(diff, side) {
  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return JSON.stringify(value)
  }

  const pathStr = diff.path.join('.')

  switch (diff.type) {
    case 'added':
      return `新增属性 '${pathStr}': ${formatValue(diff.value)}`
    case 'removed':
      return `删除属性 '${pathStr}': ${formatValue(diff.value)}`
    case 'modified':
      return side === 'left' 
        ? `属性 '${pathStr}' 原始值: ${formatValue(diff.oldValue)}`
        : `属性 '${pathStr}' 修改为: ${formatValue(diff.newValue)}`
    default:
      return ''
  }
}

function toggleCompareMode() {
  isCompareMode.value = !isCompareMode.value
  
  if (isCompareMode.value) {
    setTimeout(() => {
      if (!rightEditor && rightEditorContainer.value) {
        initializeRightEditor()
        highlightDifferences()
      } else if (rightEditor) {
        setupScrollSync()
      }
    })
  } else {
    if (rightEditor) {
      rightEditor.dispose()
      rightEditor = null
    }
  }
}

onMounted(() => {
  if (isUTools.value) {
    window.setWindowSize(1000, 700)
  }
  
  initializeMonaco()
  
  // 监听事件总线中的toast事件
  window.eventHub.on('show-toast', (data) => {
    showToast(data.message, data.type)
  })
  
  // 监听uTools窗口事件
  if (window.utools) {
    window.utools.onPluginEnter(({ code, type, payload }) => {
      console.log('Plugin entered with code:', code)
    })
    
    window.utools.onPluginOut(() => {
      // 插件被关闭时的处理
      if (fileChanged.value && leftFilePath.value) {
        // 可以在这里提示用户保存文件
      }
    })
  }
})

onBeforeUnmount(() => {
  // 清理事件监听
  window.eventHub.off('show-toast')
  
  if (leftEditor) {
    leftEditor.dispose()
  }
  if (rightEditor) {
    rightEditor.dispose()
  }
})
</script>

<template>
  <div class="app-container">
    <div class="toolbar">
      <div class="tool-button" @click="handleFormat">
        <i class="mdi mdi-format-align-left"></i>
        <span>格式化</span>
      </div>
      <div class="tool-button" @click="handleSort">
        <i class="mdi mdi-sort-alphabetical-ascending"></i>
        <span>排序</span>
      </div>
      <div class="tool-button" :class="{ active: isCompareMode }" @click="toggleCompareMode">
        <i class="mdi mdi-compare"></i>
        <span>对比</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleLoadLeftFile">
        <i class="mdi mdi-file-upload"></i>
        <span>加载左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleLoadRightFile">
        <i class="mdi mdi-file-upload-outline"></i>
        <span>加载右侧</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleSaveLeftFile">
        <i class="mdi mdi-content-save"></i>
        <span>保存左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleSaveRightFile">
        <i class="mdi mdi-content-save-outline"></i>
        <span>保存右侧</span>
      </div>
      <div v-if="isUTools" class="tool-button" @click="handleCopy('left')">
        <i class="mdi mdi-content-copy"></i>
        <span>复制左侧</span>
      </div>
      <div v-if="isUTools && isCompareMode" class="tool-button" @click="handleCopy('right')">
        <i class="mdi mdi-content-copy"></i>
        <span>复制右侧</span>
      </div>
    </div>
    <div class="editor-container" :class="{ 'compare-mode': isCompareMode }">
      <div ref="leftEditorContainer" class="editor-component"></div>
      <div v-show="isCompareMode" ref="rightEditorContainer" class="editor-component"></div>
    </div>
    
    <!-- Toast 通知组件 -->
    <transition name="toast-fade">
      <div v-if="toast.visible" class="toast-container" :class="toast.type">
        <div class="toast-icon">
          <i class="mdi" :class="{
            'mdi-check-circle': toast.type === 'success',
            'mdi-alert-circle': toast.type === 'error',
            'mdi-information': toast.type === 'info'
          }"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <div class="toast-close" @click="hideToast">
          <i class="mdi mdi-close"></i>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.toolbar {
  width: 80px;
  background-color: #2c3e50;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.tool-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
  transition: background-color 0.3s;
}

.tool-button:hover, .tool-button.active {
  background-color: #34495e;
}

.tool-button i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.tool-button span {
  font-size: 0.75rem;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-component {
  height: 100%;
  width: 100%;
  transition: width 0.3s;
}

.compare-mode .editor-component {
  width: 50%;
}

/* Toast 样式 */
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 250px;
  max-width: 600px;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  color: white;
}

.toast-container.success {
  background-color: #4caf50;
}

.toast-container.error {
  background-color: #f44336;
}

.toast-container.info {
  background-color: #2196f3;
}

.toast-icon {
  margin-right: 12px;
  font-size: 1.4rem;
}

.toast-message {
  flex: 1;
  font-size: 0.9rem;
}

.toast-close {
  margin-left: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* Toast 动画 */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.removed-line {
  background-color: rgba(255, 0, 0, 0.1);
}

.added-line {
  background-color: rgba(0, 255, 0, 0.1);
}

.modified-line {
  background-color: rgba(255, 165, 0, 0.1);
}

.removed-glyph {
  background-color: #f5485d;
  width: 5px !important;
  margin-left: 3px;
}

.added-glyph {
  background-color: #48d75f;
  width: 5px !important;
  margin-left: 3px;
}

.modified-glyph {
  background-color: #ffa500;
  width: 5px !important;
  margin-left: 3px;
}

.editor-component :deep(.monaco-editor) {
  padding-top: 10px;
}

.editor-component :deep(.monaco-editor .margin) {
  background-color: #f8f9fa;
}

.line-modified {
  background-color: rgba(255, 220, 100, 0.2) !important;
}

.line-insert {
  background-color: rgba(155, 185, 85, 0.2) !important;
}

.line-delete {
  background-color: rgba(255, 100, 100, 0.2) !important;
}

.line-decoration {
  width: 5px !important;
}

.editor-component :deep(.monaco-editor .line-numbers) {
  color: #666;
}
</style>
