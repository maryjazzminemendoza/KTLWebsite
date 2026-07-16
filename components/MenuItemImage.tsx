"use client";

import Image from "next/image";
import { useState } from "react";

type MenuItemImageProps = {
  src: string | null;
  alt: string;
};

const placeholder = "/images/food-placeholder.webp";

export default function MenuItemImage({ src, alt }: MenuItemImageProps) {
  const [imageSrc, setImageSrc] = useState(src?.trim() || placeholder);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover transition duration-700 group-hover:scale-110"
      sizes="(max-width: 768px) 100vw, 33vw"
      onError={() => setImageSrc(placeholder)}
    />
  );
}
