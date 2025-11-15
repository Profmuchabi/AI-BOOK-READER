const DB_NAME = 'AI-Audiobook-Library';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'audio_cache';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const getDB = async () => {
  if (!db) {
    db = await initDB();
  }
  return db;
};

export const storeAudio = async (bookId: string, paragraphIndex: number, audioData: Uint8Array): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(AUDIO_STORE_NAME);
        const id = `${bookId}-${paragraphIndex}`;
        const request = store.put({ id, audioData });

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Error storing audio:', request.error);
            reject(request.error);
        };
    });
};

export const getAudio = async (bookId: string, paragraphIndex: number): Promise<Uint8Array | null> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE_NAME], 'readonly');
        const store = transaction.objectStore(AUDIO_STORE_NAME);
        const id = `${bookId}-${paragraphIndex}`;
        const request = store.get(id);

        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.audioData);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => {
            console.error('Error getting audio:', request.error);
            reject(request.error);
        };
    });
};

export const getCachedParagraphs = async (bookId: string): Promise<Set<number>> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE_NAME], 'readonly');
        const store = transaction.objectStore(AUDIO_STORE_NAME);
        const cachedIndexes = new Set<number>();
        
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                if (cursor.key.toString().startsWith(`${bookId}-`)) {
                    const paragraphIndex = parseInt(cursor.key.toString().split('-').pop()!, 10);
                    if (!isNaN(paragraphIndex)) {
                       cachedIndexes.add(paragraphIndex);
                    }
                }
                cursor.continue();
            } else {
                resolve(cachedIndexes);
            }
        };
        request.onerror = () => {
             console.error('Error getting cached paragraphs:', request.error);
             reject(request.error);
        }
    });
};


export const clearBookAudio = async (bookId: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(AUDIO_STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                if (cursor.key.toString().startsWith(`${bookId}-`)) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                resolve();
            }
        };

        request.onerror = () => {
            console.error('Error clearing book audio:', request.error);
            reject(request.error);
        }
    });
};