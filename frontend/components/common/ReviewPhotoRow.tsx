import PhotoGallery from "@/components/common/PhotoGallery";

/** Thumbnails for review.images (external URLs from media service). */
export default function ReviewPhotoRow({
  urls,
}: {
  urls: string[] | undefined;
}) {
  return <PhotoGallery urls={urls} size="sm" className="mt-3" />;
}
