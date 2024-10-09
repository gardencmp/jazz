import { BookReview } from "@/schema";
import Rating from "@/components/Rating";
import { Group } from "jazz-tools";
import RatingInput from "@/components/RatingInput";
import { BookCover } from "@/components/BookCover";

export function BookReviewHeader({ bookReview }: { bookReview: BookReview }) {
  const { title, author, rating, review, dateRead } = bookReview;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="mb-1 font-serif text-2xl font-bold md:mb-3 lg:text-4xl">
          {title}
        </h1>

        <p className="text-gray-500">by {author}</p>
      </div>

      {bookReview._owner.castAs(Group).myRole() === "admin" ? (
        <RatingInput
          onChange={rating => (bookReview.rating = rating)}
          value={rating}
        />
      ) : (
        <Rating className="mx-auto text-2xl sm:mx-0" rating={rating} />
      )}
    </div>
  );
}
