import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { createImage } from "jazz-browser-media-images";

import { PetPost, PetReactions } from "./1_types";
import { Input, Button } from "./basicComponents";
import { useAccount, useCoState } from "./2_main";
import { Co, Group, ID, S } from "jazz-js";
import { ProgressiveImg } from "jazz-react";

/** Walkthrough: TODO
 */

class PartialPetPost extends Co.map({
    name: S.string,
    image: S.optional(Co.media.imageDef),
    reactions: PetReactions,
}).as<PartialPetPost>() {}

export function NewPetPostForm() {
    const { me } = useAccount();
    const navigate = useNavigate();

    const [newPostId, setNewPostId] = useState<ID<PartialPetPost> | undefined>(
        undefined
    );

    const newPetPost = useCoState(PartialPetPost, newPostId);

    const onChangeName = useCallback(
        (name: string) => {
            if (newPetPost) {
                newPetPost.name = name;
            } else {
                const petPostGroup = new Group({ owner: me });
                const petPost = new PartialPetPost(
                    {
                        name,
                        reactions: new PetReactions([], { owner: me }),
                    },
                    { owner: petPostGroup }
                );

                setNewPostId(petPost.id);
            }
        },
        [me, newPetPost]
    );

    const onImageSelected = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            if (!newPetPost || !event.target.files) return;

            const image = await createImage(event.target.files[0], {
                owner: newPetPost._owner,
            });

            newPetPost.image = image;
        },
        [newPetPost]
    );

    const onSubmit = useCallback(() => {
        if (!newPetPost) return;
        const myPosts = me.root?.posts;

        if (!myPosts) {
            throw new Error("No posts list found");
        }

        myPosts.push(newPetPost as PetPost);

        navigate("/pet/" + newPetPost.id);
    }, [me.root?.posts, newPetPost, navigate]);

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
                    {({ src }) => (
                        <img className="w-80 max-w-full rounded" src={src} />
                    )}
                </ProgressiveImg>
            ) : (
                <Input
                    type="file"
                    disabled={!newPetPost?.name}
                    onChange={onImageSelected}
                />
            )}

            {newPetPost?.name && newPetPost?.image && (
                <Button onClick={onSubmit}>Submit Post</Button>
            )}
        </div>
    );
}
