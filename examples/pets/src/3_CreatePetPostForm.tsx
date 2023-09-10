import { useCallback, useState } from "react";

import { BinaryCoStream, CoID } from "cojson";
import {
    useBinaryStream,
    useJazz,
    useTelepathicState,
    createBinaryStreamHandler,
} from "jazz-react";

import { PetPost, PetReactions } from "./1_types";

import { Input, Button } from "./basicComponents";

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
                const petReactions = petPostGroup.createStream<PetReactions>();

                petPost = petPost.edit((petPost) => {
                    petPost.set("reactions", petReactions.id);
                });

                setNewPostId(petPost.id);
            }

            petPost.edit((petPost) => {
                petPost.set("name", name);
            });
        },
        [localNode, newPetPost]
    );

    const onImageCreated = useCallback(
        (image: BinaryCoStream) => {
            if (!newPetPost) throw new Error("Never get here");
            newPetPost.edit((petPost) => {
                petPost.set("image", image.id);
            });
        },
        [newPetPost]
    );

    const petImage = useBinaryStream(newPetPost?.get("image"));

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
                <img className="max-w-xs rounded" src={petImage.blobURL} />
            ) : (
                <Input
                    type="file"
                    disabled={!newPetPost?.get("name")}
                    onChange={
                        newPetPost &&
                        createBinaryStreamHandler(
                            onImageCreated,
                            newPetPost.group
                        )
                    }
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
