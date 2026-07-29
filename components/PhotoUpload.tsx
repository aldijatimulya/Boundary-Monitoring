"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  bucket?: string;
  folder: string;
  urls: string[];
  onChange: (urls: string[]) => void;
};

export default function PhotoUpload({ bucket = "report-photos", folder, urls, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const path = `${folder}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        setError(`Gagal unggah ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    onChange([...urls, ...uploaded]);
    setUploading(false);
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="text-sm text-slate-600">Dokumentasi foto</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="mt-1 block w-full text-sm"
      />
      {uploading && <p className="mt-1 text-xs text-slate-400">Mengunggah...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {urls.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {urls.map((url, i) => (
            <div key={url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Dokumentasi ${i + 1}`} className="h-16 w-full rounded-md object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 hidden h-5 w-5 rounded-full bg-red-600 text-xs text-white group-hover:block"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
