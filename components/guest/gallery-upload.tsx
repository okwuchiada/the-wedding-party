"use client";

import { useEffect, useState } from "react";
import { createMediaUploadUrl, createMediaRecord, getMediaStatuses } from "@/lib/actions/media";
import { convertHeicToJpeg, isImageFile } from "@/lib/heic";
import { compressImage } from "@/lib/image-compress";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads";
import { useGuestSlug } from "./wedding-context";

type UploadStatus = "uploading" | "done" | "error";

type PendingUpload = {
  id: string;
  mediaId?: string;
  previewUrl: string;
  isVideo: boolean;
  fileName: string;
  status: UploadStatus;
};

const STATUS_POLL_INTERVAL_MS = 5_000;


export default function GalleryUpload({ allowVideo }: { allowVideo: boolean }) {
  const slug = useGuestSlug();
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<PendingUpload[]>([]);

  const uploadFile = async (file: File, id: string) => {
    const markError = (message: string) => {
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "error" } : u)));
      setError(message);
    };

    const urlResult = await createMediaUploadUrl(slug, file.name, file.type, file.size);
    if (!urlResult || urlResult.error || !urlResult.uploadUrl || !urlResult.publicUrl) {
      markError(urlResult?.error ?? "Upload failed. Please try again.");
      return;
    }

    const putResponse = await fetch(urlResult.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putResponse.ok) {
      markError("Upload failed. Please try again.");
      return;
    }

    const type = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
    const result = await createMediaRecord(slug, guestName, urlResult.publicUrl, type);
    if (result?.error) {
      markError(result.error);
      return;
    }

    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: "done", mediaId: result?.id } : u))
    );
  };

  useEffect(() => {
    const trackedIds = uploads
      .filter((u): u is PendingUpload & { mediaId: string } => u.status === "done" && !!u.mediaId)
      .map((u) => u.mediaId);

    if (trackedIds.length === 0) return;

    const interval = setInterval(async () => {
      const statuses = await getMediaStatuses(slug, trackedIds);
      setUploads((prev) =>
        prev.filter((u) => !u.mediaId || statuses[u.mediaId] === "PENDING")
      );
    }, STATUS_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [slug, uploads]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!guestName.trim()) {
      setError("Please enter your name first");
      return;
    }
    setError("");

    for (const rawFile of Array.from(files)) {
      const isVideo = rawFile.type.startsWith("video/");
      if (!isImageFile(rawFile) && !(isVideo && allowVideo)) {
        setError(allowVideo ? `${rawFile.name} isn't a photo or video` : `${rawFile.name} isn't a photo. This gallery takes photos only.`);
        continue;
      }
      if (rawFile.size > MAX_UPLOAD_BYTES) {
        setError(`${rawFile.name} is over the ${MAX_UPLOAD_LABEL} limit`);
        continue;
      }

      const file = isVideo ? rawFile : await compressImage(await convertHeicToJpeg(rawFile));

      const id = `${file.name}-${rawFile.lastModified}-${Math.random()}`;
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
        <label htmlFor="upload-name" className="guest-label">
          Your name
        </label>
        <input
          id="upload-name"
          autoComplete="name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="guest-input"
        />

        <label className="mt-4 flex cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-burnt-orange flex-col items-center justify-center gap-2 border border-dashed border-olive/30 bg-ivory px-4 py-8 text-center transition-colors hover:border-burnt-orange">
          <span className="text-sm font-medium text-foreground">
            {allowVideo ? "Tap to share a photo or video" : "Tap to share a photo"}
          </span>
          <span className="text-[13px] text-foreground/65">JPG, PNG, MP4 up to {MAX_UPLOAD_LABEL}</span>
          <input
            type="file"
            accept={allowVideo ? "image/*,video/*,.heic,.heif" : "image/*,.heic,.heif"}
            multiple
            onChange={(e) => {
              void handleFiles(e.target.files);
            }}
            className="sr-only"
          />
        </label>

        {error && (
          <p role="alert" className="mt-2 text-[15px] text-burnt-orange-dark">
            {error}
          </p>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="mx-auto mt-10 max-w-5xl">
          <p className="mb-4 text-[13px] tracking-[0.2em] text-olive uppercase">
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
                <span className="absolute bottom-2 left-2 bg-ivory px-2 py-1 text-[12px] tracking-wider text-burnt-orange-dark uppercase">
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
