import Link from "next/link";
import Image from "next/image";

type Props = {
    title: string;
    src: string;
    slug?: string;
};

const PostCoverImage = ({ title, src, slug }: Props) => {
    const image = (
        <Image src={src} className="w-full border" width={1300} height={630} />
    );
    return (
        <div>
            {slug ? (
                <Link href={`/posts/${slug}`} aria-label={title}>
                    {image}
                </Link>
            ) : (
                image
            )}
        </div>
    );
};

export default PostCoverImage;
