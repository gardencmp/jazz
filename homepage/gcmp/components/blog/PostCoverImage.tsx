import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { Post } from "@/interfaces/blogPost";

const PostCoverImage = ({
    post,
    className = "",
    linkToPost,
}: {
    post: Post;
    className?: string;
    linkToPost?: boolean;
}) => {
    const { title, coverImage, slug } = post;
    const image = (
        <Image
            alt=""
            src={coverImage}
            className={clsx(className, "w-full")}
            width={1300}
            height={630}
        />
    );
    return (
        <div className={className}>
            {linkToPost ? (
                <Link
                    className={className}
                    href={`/news/${slug}`}
                    aria-label={title}
                >
                    {image}
                </Link>
            ) : (
                image
            )}
        </div>
    );
};

export default PostCoverImage;
