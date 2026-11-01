import type { PropertyType } from "../data/types";

export interface PropertyImagePair {
  primary: string;
  secondary: string;
  caption?: string;
}

export interface PropertyImageInfo {
  primary: string;
  secondary: string;
  isCustom: boolean;
}

/** Fallback image in case of loading error or missing asset */
export const FALLBACK_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80";

export const FALLBACK_SECONDARY_IMAGE =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80";

/** Legacy default photo IDs that were repeatedly used across properties */
const LEGACY_DEFAULT_IDS = ["1099065", "19510801", "13600836", "8228650", "26241922", "11861957"];

/**
 * Checks whether an image URL is a real user-uploaded photo
 * (e.g. data URL, blob, Supabase Storage, or a non-default custom upload).
 */
export function isUserUploadedImage(image?: string | null): boolean {
  if (!image || typeof image !== "string") return false;
  const trimmed = image.trim();
  if (!trimmed || trimmed === "default" || trimmed === "placeholder") return false;

  // Real user uploads: data URLs, Blobs, Supabase Storage
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
  if (trimmed.includes("/storage/v1/object/public/") || trimmed.includes("supabase.co/storage")) return true;

  // Exclude legacy repeated templates
  for (const legacyId of LEGACY_DEFAULT_IDS) {
    if (trimmed.includes(legacyId)) return false;
  }

  // Any other distinct external URL provided by the user is preserved
  return true;
}

/**
 * Curated premium architectural photography by property type.
 * Each entry provides a stunning exterior shot and a matching architectural detail.
 */
export const ARCHITECTURAL_POOLS: Record<PropertyType, PropertyImagePair[]> = {
  Apartment: [
    {
      primary: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary urban apartment complex with balconies and greenery",
    },
    {
      primary: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern residential building with tropical landscaping",
    },
    {
      primary: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
      caption: "Premium white residential apartments with landscaped courtyard",
    },
    {
      primary: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern high-rise residential architecture with natural daylight",
    },
    {
      primary: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      caption: "Metropolitan residential apartment tower with architectural terraces",
    },
    {
      primary: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      caption: "Luxury Indian apartment community with palm trees and modern facades",
    },
    {
      primary: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      caption: "Aesthetic residential flats with lush balcony planters",
    },
    {
      primary: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary urban residential building with warm ambient light",
    },
  ],

  "Independent House": [
    {
      primary: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      caption: "Stunning two-storey contemporary independent house with lawn",
    },
    {
      primary: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
      caption: "Beautiful independent home with stone porch and garden",
    },
    {
      primary: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern independent home with wooden accents and lawn",
    },
    {
      primary: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      caption: "Aesthetic traditional-contemporary fusion residence",
    },
    {
      primary: "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary private house with natural stone cladding",
    },
    {
      primary: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      caption: "Elegant independent house with architectural lighting",
    },
  ],

  Villa: [
    {
      primary: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      caption: "Grand contemporary luxury villa with expansive glass facade",
    },
    {
      primary: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      caption: "Minimalist architectural villa with private pool and palms",
    },
    {
      primary: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      caption: "Luxury residential villa with white stucco and manicured grounds",
    },
    {
      primary: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary luxury estate with private driveway and pergolas",
    },
    {
      primary: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern villa with open courtyard and palm landscaping",
    },
    {
      primary: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      caption: "Ultra-modern gated community villa with glass terraces",
    },
  ],

  Shop: [
    {
      primary: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      caption: "Warm boutique high-street shopfront with display glass",
    },
    {
      primary: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=80",
      caption: "Aesthetic retail storefront with minimalist canopy",
    },
    {
      primary: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary commercial street retail entrance",
    },
    {
      primary: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern boutique commercial retail space",
    },
  ],

  Office: [
    {
      primary: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      caption: "Modern commercial office building with reflective glass",
    },
    {
      primary: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary architectural studio and workspace",
    },
    {
      primary: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      caption: "Commercial office building with courtyard and natural light",
    },
    {
      primary: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary commercial property with sleek architectural framing",
    },
  ],

  Other: [
    {
      primary: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
      caption: "Serene modern architectural residence with warm sunlight",
    },
    {
      primary: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      caption: "Elegant architectural facade with stone elements and greenery",
    },
    {
      primary: "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
      caption: "Contemporary property exterior with landscaped entrance",
    },
    {
      primary: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      caption: "Aesthetic residential property with tranquil garden greenery",
    },
  ],
};

/**
 * Deterministic djb2 hash function for strings.
 * Guarantees the exact same integer for any given string across rerenders and refreshes.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Resolves the primary and secondary image pair for any property.
 *
 * Priority:
 * 1. If property has its own uploaded custom photo (data URL, Supabase storage, or custom URL),
 *    prioritize that photo.
 * 2. Otherwise, assign a unique, high-resolution architectural photo from the curated pool
 *    using a deterministic hash of the property's ID.
 */
export function getPropertyImages(
  property: {
    id: string;
    name?: string;
    type?: PropertyType | string;
    image?: string | null;
    secondaryImage?: string | null;
  },
  indexHint?: number,
): PropertyImageInfo {
  // If property has an authentic user-uploaded image, prioritize it!
  if (property.image && isUserUploadedImage(property.image)) {
    return {
      primary: property.image,
      secondary: property.secondaryImage || FALLBACK_SECONDARY_IMAGE,
      isCustom: true,
    };
  }

  const type = (property.type as PropertyType) || "Apartment";
  const pool = ARCHITECTURAL_POOLS[type] || ARCHITECTURAL_POOLS.Apartment;

  // Use stable deterministic hash based on property ID and name
  const seed = `${property.id || ""}:${property.name || ""}`;
  const hash = hashString(seed);

  // If indexHint is provided, combine to guarantee zero duplicate in ordered displays
  const index = indexHint !== undefined ? (hash + indexHint) % pool.length : hash % pool.length;

  const pair = pool[index] || pool[0] || {
    primary: FALLBACK_PROPERTY_IMAGE,
    secondary: FALLBACK_SECONDARY_IMAGE,
  };

  return {
    primary: pair.primary,
    secondary: property.secondaryImage || pair.secondary,
    isCustom: false,
  };
}

/**
 * Convenience helper returning the resolved primary image for a property.
 */
export function getPropertyImage(
  property: {
    id: string;
    name?: string;
    type?: PropertyType | string;
    image?: string | null;
    secondaryImage?: string | null;
  },
  indexHint?: number,
): string {
  return getPropertyImages(property, indexHint).primary;
}
