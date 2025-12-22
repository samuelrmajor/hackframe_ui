import { useCallback, useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LocalPhotoManagerViewProps {
  supabase: SupabaseClient;
  userId: string;
  onBack: () => void;
  bucketName?: string;
}

type StorageFile = {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: any;
};

const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]; // keep in sync with UploadedPhotosWidget

export default function LocalPhotoManagerView({
  supabase,
  userId,
  onBack,
  bucketName = "images",
}: LocalPhotoManagerViewProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const imageFiles = useMemo(() => {
    return files.filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return !!ext && SUPPORTED_FORMATS.includes(ext);
    });
  }, [files]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const listRes = await supabase.storage.from(bucketName).list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

      if (listRes.error) throw listRes.error;

      const nextFiles = ((listRes.data ?? []) as StorageFile[]).filter(Boolean);
      setFiles(nextFiles);

      // signed urls
      const urlEntries = await Promise.all(
        nextFiles.map(async (f) => {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(`${userId}/${f.name}`, 3600);
          if (error || !data?.signedUrl) return [f.name, ""] as const;
          return [f.name, data.signedUrl] as const;
        })
      );

      const nextSigned: Record<string, string> = {};
      for (const [name, url] of urlEntries) {
        if (url) nextSigned[name] = url;
      }
      setSignedUrls(nextSigned);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setFiles([]);
      setSignedUrls({});
    } finally {
      setLoading(false);
    }
  }, [bucketName, supabase, userId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploads = Array.from(fileList).map(async (file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniquePrefix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const path = `${userId}/${uniquePrefix}_${safeName}`;

        const res = await supabase.storage.from(bucketName).upload(path, file, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type || undefined,
        });
        if (res.error) throw res.error;
      });

      await Promise.all(uploads);
      await loadFiles();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (name: string) => {
    const ok = window.confirm(`Delete ${name}?`);
    if (!ok) return;

    setDeletingName(name);
    setError(null);

    try {
      const res = await supabase.storage.from(bucketName).remove([`${userId}/${name}`]);
      if (res.error) throw res.error;
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingName((cur) => (cur === name ? null : cur));
    }
  };

  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Picture Scroller Images</h2>
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div className="text-xs text-gray-400 mb-3">Bucket: {bucketName}/{userId}</div>

        <div className="mb-4">
          <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 hover:bg-white/10 cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept={SUPPORTED_FORMATS.map((e) => `image/${e}`).join(",") + ",image/*"}
              multiple
              disabled={uploading}
              onChange={(e) => onUploadFiles(e.target.files)}
            />
            <span className="text-sm">{uploading ? "Uploading..." : "Upload images"}</span>
          </label>
          {uploadError && <div className="mt-2 text-sm text-red-300">{uploadError}</div>}
        </div>

        {loading && <div className="text-sm text-gray-300">Loading...</div>}
        {error && <div className="text-sm text-red-300">{error}</div>}

        {!loading && !error && (
          <div className="space-y-3">
            {imageFiles.length === 0 ? (
              <div className="text-sm text-gray-300">No images found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {imageFiles.map((f) => (
                  <div key={f.name} className="rounded-xl border border-white/20 bg-white/5 p-2">
                    <div className="aspect-video bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                      {signedUrls[f.name] ? (
                        <img
                          src={signedUrls[f.name]}
                          alt={f.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-xs text-gray-400">(preview unavailable)</div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-300 truncate" title={f.name}>
                          {f.name}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 hover:bg-white/10 disabled:opacity-50"
                        disabled={deletingName === f.name}
                        onClick={() => deleteFile(f.name)}
                      >
                        {deletingName === f.name ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
