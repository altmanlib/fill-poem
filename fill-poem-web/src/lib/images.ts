interface DecodableImage {
  decode?: () => Promise<void>;
}

export async function decodeImages(images: Iterable<DecodableImage>): Promise<void> {
  await Promise.all(
    Array.from(images, async (image) => {
      try {
        await image.decode?.();
      } catch {
        // Decorative assets must not block the interactive page.
      }
    })
  );
}
