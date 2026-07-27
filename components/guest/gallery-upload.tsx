"use client";

import { useState } from "react";
import { uploadMedia } from "@/lib/actions/media";

type UploadStatus = "uploading" | "done" | "error";

type PendingUpload = {
  id: string;
  previewUrl: string;
  isVideo: boolean;
  fileName: string;
  status: UploadStatus;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function GalleryUpload() {
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<PendingUpload[]>([]);

  const uploadFile = async (file: File, id: string) => {
    const formData = new FormData();
    formData.set("guestName", guestName);
    formData.set("file", file);

    const result = await uploadMedia(undefined, formData);
    if (result?.error) {
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "error" } : u)));
      setError(result.error);
      return;
    }

    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "done" } : u)));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!guestName.trim()) {
      setError("Please enter your name first");
      return;
    }
    setError("");

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError(`${file.name} isn't a photo or video`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is over the 25MB limit`);
        continue;
      }

      const id = `${file.name}-${file.lastModified}-${Math.random()}`;
      setUploads((prev) => [
        { id, previewUrl: URL.createObjectURL(file), isVideo, fileName: file.name, status: "uploading" },
        ...prev,
      ]);
      uploadFile(file, id);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-xl">
        <input
          placeholder="Your name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full border border-olive/20 bg-white px-4 py-3 text-sm outline-none"
        />

        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-olive/30 bg-ivory px-4 py-8 text-center transition-colors hover:border-burnt-orange">
          <span className="text-sm font-medium text-foreground">
            Tap to share a photo or video
          </span>
          <span className="text-xs text-foreground/60">JPG, PNG, MP4 up to 25MB</span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>

        {error && <p className="mt-2 text-xs text-burnt-orange">{error}</p>}
      </div>

      {uploads.length > 0 && (
        <div className="mx-auto mt-10 max-w-5xl">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-olive">
            Your uploads
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="relative aspect-square overflow-hidden bg-olive/10">
                {upload.isVideo ? (
                  <video src={upload.previewUrl} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={upload.previewUrl} alt={upload.fileName} className="h-full w-full object-cover" />
                )}
                <span className="absolute bottom-2 left-2 bg-ivory px-2 py-1 text-[10px] tracking-widest text-burnt-orange-dark uppercase">
                  {upload.status === "uploading"
                    ? "Uploading…"
                    : upload.status === "error"
                      ? "Failed"
                      : "Awaiting approval"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
