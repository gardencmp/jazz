import Avatar from "@/components/Avatar";
import { type Author } from "@/interfaces/author";
import { H1 } from "gcmp-design-system/src/app/components/atoms/Headings";
import DateFormatter from "@/components/DateFormatter";
import PostCoverImage from "@/components/blog/PostCoverImage";

type Props = {
    title: string;
    coverImage: string;
    date: Date;
    author: Author;
};

export function PostHeader({ title, coverImage, date, author }: Props) {
    return (
        <>
            <H1>{title}</H1>
            <div className="hidden md:block md:mb-12">
                <Avatar name={author.name} picture={author.picture} />
            </div>
            <div className="mb-8 md:mb-16 sm:mx-0">
                <PostCoverImage title={title} src={coverImage} />
            </div>
            <div className="max-w-2xl mx-auto">
                <div className="block md:hidden mb-6">
                    <Avatar name={author.name} picture={author.picture} />
                </div>
                <div className="mb-6 text-lg">
                    <DateFormatter date={date} />
                </div>
            </div>
        </>
    );
}
