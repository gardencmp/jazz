import { useCallback } from "react";

import { ListOfTasks, TodoProject } from "./1_schema";

import { SubmittableInput } from "./basicComponents";

import { useNavigate } from "react-router";
import { useAccount } from "./2_main";
import { Group } from "jazz-tools";

export function NewProjectForm() {
    // `me` represents the current user account, which will determine
    // access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
    const { me } = useAccount();
    const navigate = useNavigate();

    const createProject = useCallback(
        (title: string) => {
            if (!me || !title) return;

            // To create a new todo project, we first create a `Group`,
            // which is a scope for defining access rights (reader/writer/admin)
            // of its members, which will apply to all CoValues owned by that group.
            const projectGroup = Group.create({ owner: me });

            // Then we create an empty todo project within that group
            const project = TodoProject.create(
                {
                    title,
                    tasks: ListOfTasks.create([], { owner: projectGroup }),
                },
                { owner: projectGroup },
            );

            me.root?.projects?.push(project);

            navigate("/project/" + project.id);
        },
        [me, navigate],
    );

    return (
        <SubmittableInput
            onSubmit={createProject}
            label="Create New Project"
            placeholder="New project title"
        />
    );
}

/** Walkthrough: continue with ./4_ProjectTodoTable.tsx */
