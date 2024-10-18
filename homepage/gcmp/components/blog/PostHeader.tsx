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
        <div className="flex flex-col gap-4">
            <div>
                <H1>{title}</H1>
                <DateFormatter date={date} />
            </div>
            <div>
                <PostCoverImage
                    className="border"
                    title={title}
                    src={coverImage}
                />
            </div>
        </div>
    );
}
