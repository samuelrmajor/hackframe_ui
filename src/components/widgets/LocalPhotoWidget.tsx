import { useEffect, useState } from "react";
import Card from "./Card";

interface LocalPhotoWidgetProps {
  folderPath: string; // This is just used as an identifier/label now
}

export default function LocalPhotoWidget({ folderPath }: LocalPhotoWidgetProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSelectedFolder, setHasSelectedFolder] = useState(false);

  // Configure these settings
  const CYCLE_INTERVAL = 10000; // 10 seconds between photos
  const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const DB_NAME = 'LocalPhotoWidget';
  const STORE_NAME = 'directoryHandles';
  const HANDLE_KEY = `folder_${folderPath}`;

  // Open IndexedDB
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  };

  // Save directory handle to IndexedDB
  const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(handle, HANDLE_KEY);
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error saving directory handle:', error);
    }
  };

  // Load directory handle from IndexedDB
  const loadDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading directory handle:', error);
      return null;
    }
  };

  // Read photos from directory handle
  const readPhotosFromHandle = async (handle: FileSystemDirectoryHandle) => {
    const photoUrls: string[] = [];
    
    try {
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const extension = file.name.split('.').pop()?.toLowerCase();
          
          if (extension && SUPPORTED_FORMATS.includes(extension)) {
            const url = URL.createObjectURL(file);
            photoUrls.push(url);
          }
        }
      }
      
      setPhotos(photoUrls);
      setCurrentPhotoIndex(0);
      setHasSelectedFolder(true);
    } catch (error) {
      console.error('Error reading photos from handle:', error);
      // Permission might have been revoked, need to re-request
      setHasSelectedFolder(false);
    }
  };

  // Load photos from user-selected directory
  const loadPhotosFromDirectory = async () => {
    setIsLoading(true);
    
    try {
      // Request user to select the directory
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'read'
      });

      // Save the handle for future use
      await saveDirectoryHandle(handle);
      
      // Read photos from the handle
      await readPhotosFromHandle(handle);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error reading directory:', error);
      }
    }
    
    setIsLoading(false);
  };

  // Try to load from saved handle, or prompt user
  useEffect(() => {
    const initializePhotos = async () => {
      setIsLoading(true);
      
      // Try to load saved directory handle
      const savedHandle = await loadDirectoryHandle();
      
      if (savedHandle) {
        // Verify we still have permission
        // @ts-ignore
        const permission = await savedHandle.queryPermission({ mode: 'read' });
        
        if (permission === 'granted') {
          await readPhotosFromHandle(savedHandle);
          setIsLoading(false);
          return;
        }
        
        // Try to request permission again
        // @ts-ignore
        const requestPermission = await savedHandle.requestPermission({ mode: 'read' });
        if (requestPermission === 'granted') {
          await readPhotosFromHandle(savedHandle);
          setIsLoading(false);
          return;
        }
      }
      
      // No saved handle or permission denied, need user to select
      setIsLoading(false);
      
      // Small delay to avoid immediate popup
      setTimeout(() => {
        loadPhotosFromDirectory();
      }, 500);
    };
    
    if (!hasSelectedFolder) {
      initializePhotos();
    }
  }, []);

  // Clean up object URLs when component unmounts or photos change
  useEffect(() => {
    return () => {
      photos.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photos]);

  // Auto-cycle through photos
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  if (!hasSelectedFolder && !isLoading) {
    return (
      <Card centered={true}>
        <div className="text-center">
          <div className="text-white/70 text-sm mb-4">📷 Local Photos</div>
          <button
            onClick={loadPhotosFromDirectory}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors border border-white/30"
          >
            Select Photo Folder
          </button>
          <div className="text-white/50 text-xs mt-3">
            Folder: {folderPath}
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card centered={true}>
        <div className="text-white/70 text-sm">Loading photos...</div>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card centered={true}>
        <div className="text-white/70 text-sm text-center">
          <div className="mb-3">📷 No photos found</div>
          <button
            onClick={loadPhotosFromDirectory}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
          >
            Try Different Folder
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card centered={false}>
      <div 
        className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/20 cursor-pointer"
        onClick={handleNextPhoto}
      >
        <img
          key={currentPhotoIndex}
          src={photos[currentPhotoIndex]}
          alt={`Photo ${currentPhotoIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-opacity duration-1000 rounded-lg shadow-2xl border-2 border-white/10"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    </Card>
  );
}

