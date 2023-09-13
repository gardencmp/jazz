import { ChangeEvent, useCallback, useState } from "react";

import { CoID } from "cojson";
import { useJazz, useTelepathicState } from "jazz-react";
import { createImage } from "jazz-browser-media-images";

import { PetPost, PetReactions } from "./1_types";

import { Input, Button } from "./basicComponents";
import { useLoadImage } from "jazz-react-media-images";

/** Walkthrough: TODO
 */

export function CreatePetPostForm({
    onCreate,
}: {
    onCreate: (id: CoID<PetPost>) => void;
}) {
    const { localNode } = useJazz();

    const [newPostId, setNewPostId] = useState<CoID<PetPost> | undefined>(
        undefined
    );

    const newPetPost = useTelepathicState(newPostId);

    const onChangeName = useCallback(
        (name: string) => {
            let petPost = newPetPost;
            if (!petPost) {
                const petPostGroup = localNode.createGroup();
                petPost = petPostGroup.createMap<PetPost>();

                petPost = petPost.edit((petPost) => {
                    petPost.set(
                        "reactions",
                        petPostGroup.createStream<PetReactions>()
                    );
                });

                setNewPostId(petPost.id);
            }

            petPost.edit((petPost) => {
                petPost.set("name", name);
            });
        },
        [localNode, newPetPost]
    );

    const onImageSelected = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            if (!newPetPost || !event.target.files) return;

            const imageDefinition = await createImage(
                event.target.files[0],
                newPetPost.group
            );

            newPetPost.edit((petPost) => {
                petPost.set("image", imageDefinition.id);
            });
        },
        [newPetPost]
    );

    const petImage = useLoadImage(newPetPost?.get("image"));

    return (
        <div className="flex flex-col gap-10">
            <p>Share your pet with friends!</p>
            <Input
                type="text"
                placeholder="Pet Name"
                className="text-3xl py-6"
                onChange={(event) => onChangeName(event.target.value)}
                value={newPetPost?.get("name") || ""}
            />

            {petImage ? (
                <img
                    className="w-80 max-w-full rounded"
                    src={petImage.highestResSrc || petImage.placeholderDataURL}
                />
            ) : (
                <Input
                    type="file"
                    disabled={!newPetPost?.get("name")}
                    onChange={onImageSelected}
                />
            )}

            {newPetPost?.get("name") && newPetPost?.get("image") && (
                <Button
                    onClick={() => {
                        onCreate(newPetPost.id);
                    }}
                >
                    Submit Post
                </Button>
            )}
        </div>
    );
}
