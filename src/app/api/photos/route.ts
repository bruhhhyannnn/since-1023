import { LIMITS } from "@/lib/photos";
import { requirePasscode } from "@/lib/passcode";
import { StoreNotConfiguredError, getStore } from "@/lib/store";

const isJpeg = async (blob: Blob) => {
  const head = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
};

/** Upload one photo. The browser has already resized it to JPEG. */
export async function POST(request: Request) {
  const denied = requirePasscode(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "That upload didn't come through. Try again?" }, { status: 400 });
  }

  const full = form.get("full");
  const thumb = form.get("thumb");
  const takenAt = String(form.get("takenAt") ?? "");
  const caption = String(form.get("caption") ?? "").trim().slice(0, LIMITS.maxCaption) || null;
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  if (!(full instanceof Blob) || !(thumb instanceof Blob)) {
    return Response.json({ error: "No photo found in the upload." }, { status: 400 });
  }
  if (full.size + thumb.size > LIMITS.maxUploadBytes) {
    return Response.json({ error: "That photo is too big." }, { status: 413 });
  }
  if (!(await isJpeg(full)) || !(await isJpeg(thumb))) {
    return Response.json({ error: "Only photos can be uploaded." }, { status: 400 });
  }
  if (Number.isNaN(Date.parse(takenAt))) {
    return Response.json({ error: "The photo date is missing." }, { status: 400 });
  }
  if (!(width > 0 && height > 0)) {
    return Response.json({ error: "The photo size is missing." }, { status: 400 });
  }

  try {
    const photo = await getStore().create({
      full,
      thumb,
      takenAt: new Date(takenAt).toISOString(),
      caption,
      width: Math.round(width),
      height: Math.round(height),
    });
    return Response.json({ photo }, { status: 201 });
  } catch (err) {
    const status = err instanceof StoreNotConfiguredError ? 503 : 500;
    return Response.json({ error: (err as Error).message }, { status });
  }
}
