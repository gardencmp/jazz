import { useCallback, useState } from "react";

import { BinaryCoStream, CoID } from "cojson";
import {
    useBinaryStream,
    useJazz,
    useTelepathicState,
} from "jazz-react";

import { PetPost, PetReactions, ReactionType } from "./1_types";

import {
    Input,
    Button,
} from "./basicComponents";

import { InviteButton } from "./components/InviteButton";
import { NameBadge } from "./components/NameBadge";
import { useDebouncedCallback } from "use-debounce";
import { createBinaryStreamHandler } from "jazz-react";

/** Walkthrough: TODO
 */

export function CreatePetPostForm({
    onCreate,
}: {
    onCreate: (id: CoID<PetPost>) => void;
}) {
    const { localNode } = useJazz();

    const [creatingPostId, setCreatingPostId] = useState<
        CoID<PetPost> | undefined
    >(undefined);

    const creatingPetPost = useTelepathicState(creatingPostId);

    const onChangeName = useDebouncedCallback((name: string) => {
        let petPost = creatingPetPost;
        if (!petPost) {
            const petPostGroup = localNode.createGroup();
            petPost = petPostGroup.createMap<PetPost>();
            const reactions = petPostGroup.createStream<PetReactions>();

            petPost = petPost.edit((petPost) => {
                petPost.set("reactions", reactions.id);
            });

            setCreatingPostId(petPost.id);
        }

        petPost.edit((petPost) => {
            petPost.set("name", name);
        });
    }, 200);

    const onImageCreated = useCallback(
        (image: BinaryCoStream) => {
            if (!creatingPetPost) throw new Error("Never get here");
            creatingPetPost.edit((petPost) => {
                petPost.set("image", image.id);
            });
        },
        [creatingPetPost]
    );

    const image = useBinaryStream(creatingPetPost?.get("image"));

    return (
        <div>
            <Input
                type="text"
                placeholder="Pet Name"
                onChange={event => onChangeName(event.target.value)}
                value={creatingPetPost?.get("name")}
            />

            {image ? (
                <img src={image.blobURL} />
            ) : (
                creatingPetPost && (
                    <Input
                        type="file"
                        onChange={createBinaryStreamHandler(
                            onImageCreated,
                            creatingPetPost.group
                        )}
                    />
                )
            )}

            {creatingPetPost?.get("name") && creatingPetPost?.get("image") && (
                <Button
                    onClick={() => {
                        onCreate(creatingPetPost.id);
                    }}
                >
                    Submit Post
                </Button>
            )}
        </div>
    );
}
