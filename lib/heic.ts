const HEIC_EXTENSION_RE = /\.(heic|heif)$/i;

export function isHeicFile(file: File) {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    HEIC_EXTENSION_RE.test(file.name)
  );
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/") || isHeicFile(file);
}

export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;

  return new File([blob], file.name.replace(HEIC_EXTENSION_RE, ".jpg"), {
    type: "image/jpeg",
  });
}
