import { clsx } from "clsx";
import Image from "next/image";
import Link from "next/link";

const PostCoverImage = ({
  src,
  title,
  slug,
  alt = "",
  className,
}: {
  src: string;
  title: string;
  slug?: string;
  alt?: string;
  className?: string;
}) => {
  const image = (
    <Image
      alt={alt}
      src={src}
      className={clsx(className, "w-full")}
      width={1300}
      height={630}
    />
  );
  return (
    <div className={className}>
      {slug ? (
        <Link className={className} href={`/news/${slug}`} aria-label={title}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
};

export default PostCoverImage;
