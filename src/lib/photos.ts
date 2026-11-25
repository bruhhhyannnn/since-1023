/** A photo as the pages see it. Shared by server and client code. */
export type Photo = {
  id: string;
  /** When the photo was taken (ISO, UTC). Decides which monthsary album it's in. */
  takenAt: string;
  caption: string | null;
  favorite: boolean;
  /** Full size (max 2048px), used for the monthsary post and the lightbox. */
  url: string;
  /** Small version (max 640px) for grids. */
  thumbUrl: string;
  width: number;
  height: number;
  createdAt: string;
};

export type PhotoPatch = {
  favorite?: boolean;
  caption?: string | null;
  takenAt?: string;
};

export const LIMITS = {
  /** Vercel rejects request bodies over 4.5 MB, so uploads stay under this. */
  maxUploadBytes: 4_300_000,
  maxCaption: 300,
};

const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPhotoId = (id: unknown): id is string => typeof id === "string" && PHOTO_ID.test(id);
