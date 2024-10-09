"use client";

import { ChangeEvent, useState } from "react";
import { BookReview, ListOfBookReviews } from "@/schema";
import { useAccount } from "@/components/JazzAndAuth";
import { useRouter } from "next/navigation";
import RatingInput from "@/components/RatingInput";
import { createImage } from "jazz-browser-media-images";
import { Group, ImageDefinition } from "jazz-tools";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";

export default function AddBookReview() {
  const { me } = useAccount();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [dateRead, setDateRead] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [coverImage, setCoverImage] = useState<ImageDefinition | undefined>();

  const router = useRouter();

  const onDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const date = new Date(event.currentTarget.value)
      .toISOString()
      .split("T")[0];
    setDateRead(date);
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    const group = Group.create({ owner: me });
    group.addMember("everyone", "reader");

    if (file) {
      createImage(file, { owner: group }).then(image => {
        setCoverImage(image);
      });
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me?.profile) return;

    const bookReview = BookReview.create(
      {
        title,
        author,
        review,
        rating,
        dateRead: new Date(dateRead),
        cover: coverImage,
      },
      {
        owner: me.profile._owner,
      }
    );

    if (!me.profile.bookReviews) {
      me.profile.bookReviews = ListOfBookReviews.create([], {
        owner: me.profile._owner,
      });
    }

    me.profile.bookReviews.push(bookReview);
    router.push("/");
  };

  return (
    <Container className="grid max-w-lg gap-8 py-8">
      <h1 className="text-lg font-semibold text-black">Add book review</h1>
      <form action="" className="grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm text-gray-600">
          Cover
          <input type="file" onChange={onImageChange} />
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          Title
          <input
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            type="text"
            value={title}
            required
            onChange={e => setTitle(e.target.value)}
          ></input>
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          Author
          <input
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            type="text"
            value={author}
            required
            onChange={e => setAuthor(e.target.value)}
          ></input>
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          Date read
          <input
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            type="date"
            value={dateRead}
            required
            onChange={onDateChange}
          />
        </label>

        <div className="grid gap-1 text-sm text-gray-600">
          Rating
          <RatingInput value={rating} onChange={rating => setRating(rating)} />
        </div>

        <label className="grid gap-1 text-sm text-gray-600">
          Review
          <textarea
            className="rounded border border-gray-300 px-2 py-1 shadow-sm"
            value={review}
            onChange={e => setReview(e.target.value)}
          ></textarea>
        </label>
        <Button variant="primary" type="submit">
          Add
        </Button>
      </form>
    </Container>
  );
}
