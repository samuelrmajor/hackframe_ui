import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import Card from "./Card";

interface SupabasePhotoWidgetProps {
  session: Session;
  supabase: SupabaseClient;
  bucketName?: string; // Optional bucket name, defaults to 'photos'
}

export default function SupabasePhotoWidget({ 
  session, 
  supabase, 
  bucketName = 'images' 
}: SupabasePhotoWidgetProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configure these settings
  const CYCLE_INTERVAL = 10000; // 10 seconds between photos
  const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

  // Fetch photos from Supabase storage
  const loadPhotosFromSupabase = async () => {
    setIsLoading(true);
    
    try {
      const userId = session.user.id;
      const folderPath = `${userId}/`;

      // List all files in the user's folder
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        setPhotos([]);
        setIsLoading(false);
        return;
      }

      // Filter for supported image formats
      const imageFiles = files.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension && SUPPORTED_FORMATS.includes(extension);
      });

      // Get signed URLs for each image (valid for 1 hour)
      const imageUrlPromises = imageFiles.map(async (file) => {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(`${folderPath}${file.name}`, 3600); // 1 hour expiry
        
        if (error) {
          console.error(`Error creating signed URL for ${file.name}:`, error);
          return null;
        }
        
        return data.signedUrl;
      });

      const imageUrls = (await Promise.all(imageUrlPromises)).filter((url): url is string => url !== null);

      setPhotos(imageUrls);
      setCurrentPhotoIndex(0);
    } catch (err) {
      console.error('Error loading photos from Supabase:', err);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load photos on mount and refresh URLs every 50 minutes (before 1-hour expiry)
  useEffect(() => {
    loadPhotosFromSupabase();
    
    // Refresh URLs every 50 minutes to prevent expiration
    const refreshInterval = setInterval(() => {
      loadPhotosFromSupabase();
    }, 50 * 60 * 1000); // 50 minutes in milliseconds
    
    return () => clearInterval(refreshInterval);
  }, [session.user.id, bucketName]);

  // Preload next image
  useEffect(() => {
    if (photos.length <= 1) return;
    
    const nextIndex = (currentPhotoIndex + 1) % photos.length;
    const img = new Image();
    img.src = photos[nextIndex];
  }, [currentPhotoIndex, photos]);

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
          <div className="text-white/50 text-xs mt-2">
            Upload photos to your Supabase storage bucket
          </div>
          <div className="text-white/40 text-xs mt-1">
            Bucket: {bucketName}/{session.user.id}
          </div>
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

