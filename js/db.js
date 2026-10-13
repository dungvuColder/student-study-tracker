/**
 * db.js - IndexedDB Wrapper for Local File Storage
 * Database: StudyTrackerDB
 * Store: documents (stores full file blobs for offline storage & retrieval)
 */

const DB_NAME = 'StudyTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

class DocumentDatabase {
  constructor() {
    this.db = null;
  }

  // Khởi tạo kết nối IndexedDB
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('courseId', 'courseId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Lưu file blob vào store
  async saveFile(fileData) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileData);

      request.onsuccess = () => resolve(fileData.id);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Lấy file theo ID
  async getFile(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Xóa file theo ID
  async deleteFile(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Lấy tất cả file theo courseId
  async getFilesByCourse(courseId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('courseId');
      const request = index.getAll(courseId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

// Khởi tạo instance toàn cục
window.docDB = new DocumentDatabase();
