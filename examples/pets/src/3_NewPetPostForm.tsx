import { createImage } from "jazz-browser-media-images";
/* eslint-disable react-hooks/exhaustive-deps */
import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";

import { ProgressiveImg } from "jazz-react";
import { CoMap, Group, ID, ImageDefinition, co } from "jazz-tools";
import { PetPost, PetReactions } from "./1_schema";
import { useAccount, useCoState } from "./2_main";
import { Button, Input } from "./basicComponents";

/** Walkthrough: TODO
 */

class PartialPetPost extends CoMap {
  name = co.string;
  image = co.ref(ImageDefinition, { optional: true });
  reactions = co.ref(PetReactions);
}

export function NewPetPostForm() {
  const { me } = useAccount();
  const navigate = useNavigate();

  const [newPostId, setNewPostId] = useState<ID<PartialPetPost> | undefined>(
    undefined,
  );

  const newPetPost = useCoState(PartialPetPost, newPostId);

  const onChangeName = useCallback(
    (name: string) => {
      if (!me) return;
      if (newPetPost) {
        newPetPost.name = name;
      } else {
        const petPostGroup = Group.create({ owner: me });
        const petPost = PartialPetPost.create(
          {
            name,
            reactions: PetReactions.create([], {
              owner: petPostGroup,
            }),
          },
          { owner: petPostGroup },
        );

        setNewPostId(petPost.id);
      }
    },
    [me, newPetPost],
  );

  const onImageSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!newPetPost || !event.target.files) return;

      const image = await createImage(event.target.files[0], {
        owner: newPetPost._owner,
      });

      newPetPost.image = image;
    },
    [newPetPost],
  );

  const onSubmit = useCallback(() => {
    if (!me || !newPetPost) return;
    const myPosts = me.root?.posts;

    if (!myPosts) {
      throw new Error("No posts list found");
    }

    myPosts.push(newPetPost as PetPost);

    navigate("/pet/" + newPetPost.id);
  }, [me?.root?.posts, newPetPost, navigate]);

  return (
    <div className="flex flex-col gap-10">
      <p>Share your pet with friends!</p>
      <Input
        type="text"
        placeholder="Pet Name"
        className="text-3xl py-6"
        onChange={(event) => onChangeName(event.target.value)}
        value={newPetPost?.name || ""}
      />

      {newPetPost?.image ? (
        <ProgressiveImg image={newPetPost.image}>
          {({ src }) => <img className="w-80 max-w-full rounded" src={src} />}
        </ProgressiveImg>
      ) : (
        <Input
          type="file"
          disabled={!newPetPost?.name}
          onChange={onImageSelected}
          data-testid="file-upload"
        />
      )}

      {newPetPost?.name && newPetPost?.image && (
        <Button onClick={onSubmit}>Submit Post</Button>
      )}
    </div>
  );
}
