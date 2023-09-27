import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";

import { CoID, CoMap, Media, Profile, Queried } from "cojson";
import { useJazz, useSyncedQuery } from "jazz-react";
import { BrowserImage, createImage } from "jazz-browser-media-images";

import { PetAccountRoot, PetPost, PetReactions } from "./1_types";

import { Input, Button } from "./basicComponents";

/** Walkthrough: TODO
 */

type PartialPetPost = CoMap<{
    name: string;
    image?: Media.ImageDefinition["id"];
    reactions: PetReactions["id"];
}>;

export function NewPetPostForm() {
    const { me } = useJazz<Profile, PetAccountRoot>();
    const navigate = useNavigate();

    const [newPostId, setNewPostId] = useState<
        CoID<PartialPetPost> | undefined
    >(undefined);

    const newPetPost = useSyncedQuery(newPostId);

    const onChangeName = useCallback(
        (name: string) => {
            if (newPetPost) {
                newPetPost.set({ name });
            } else {
                const petPostGroup = me.createGroup();
                const petPost = petPostGroup.createMap<PartialPetPost>({
                    name,
                    reactions: petPostGroup.createStream<PetReactions>().id,
                });

                setNewPostId(petPost.id);
            }
        },
        [me, newPetPost]
    );

    const onImageSelected = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            if (!newPetPost || !event.target.files) return;

            const image = await createImage(
                event.target.files[0],
                newPetPost.group
            );

            newPetPost.set({ image: image.id });
        },
        [newPetPost]
    );

    const onSubmit = useCallback(() => {
        if (!newPetPost) return;
        const myPosts = me.root?.posts;

        if (!myPosts) {
            throw new Error("No posts list found");
        }

        myPosts.append(newPetPost.id as PetPost["id"]);

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
                <img
                    className="w-80 max-w-full rounded"
                    src={
                        newPetPost?.image.as(BrowserImage)
                            ?.highestResSrcOrPlaceholder
                    }
                />
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
