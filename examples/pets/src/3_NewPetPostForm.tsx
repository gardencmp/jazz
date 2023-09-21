import { ChangeEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";

import { CoID, CoMap, Media } from "cojson";
import { useJazz, useSyncedQuery } from "jazz-react";
import { createImage } from "jazz-browser-media-images";

import { PetReactions } from "./1_types";

import { Input, Button } from "./basicComponents";
import { useLoadImage } from "jazz-react-media-images";

/** Walkthrough: TODO
 */

type PartialPetPost = CoMap<{
    name: string;
    image?: Media.ImageDefinition;
    reactions: PetReactions;
}>;

export function NewPetPostForm() {
    const { localNode } = useJazz();
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
                const petPostGroup = localNode.createGroup();
                const petPost = petPostGroup.createMap<PartialPetPost>({
                    name,
                    reactions: petPostGroup.createStream<PetReactions>(),
                });

                setNewPostId(petPost.id);
            }
        },
        [localNode, newPetPost]
    );

    const onImageSelected = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            if (!newPetPost || !event.target.files) return;

            const image = await createImage(
                event.target.files[0],
                newPetPost.group
            );

            newPetPost.set({ image });
        },
        [newPetPost]
    );

    const petImage = useLoadImage(newPetPost?.image?.id);

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

            {petImage ? (
                <img
                    className="w-80 max-w-full rounded"
                    src={petImage.highestResSrc || petImage.placeholderDataURL}
                />
            ) : (
                <Input
                    type="file"
                    disabled={!newPetPost?.name}
                    onChange={onImageSelected}
                />
            )}

            {newPetPost?.name && newPetPost?.image && (
                <Button
                    onClick={() => {
                        navigate("/pet/" + newPetPost.id);
                    }}
                >
                    Submit Post
                </Button>
            )}
        </div>
    );
}
