import { useCallback } from "react";

import { useJazz } from "jazz-react";

import { ListOfTasks, TodoProject } from "./1_types";

import { SubmittableInput } from "./basicComponents";

import { useNavigate } from "react-router";

export function NewProjectForm() {
    // `me` represents the current user account, which will determine
    // access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
    const { me } = useJazz();
    const navigate = useNavigate();

    const createProject = useCallback(
        (title: string) => {
            if (!title) return;

            // To create a new todo project, we first create a `Group`,
            // which is a scope for defining access rights (reader/writer/admin)
            // of its members, which will apply to all CoValues owned by that group.
            const projectGroup = me.createGroup();

            // Then we create an empty todo project within that group
            const project = projectGroup.createMap<TodoProject>({
                title,
                tasks: projectGroup.createList<ListOfTasks>().id,
            });

            navigate("/project/" + project.id);
        },
        [me, navigate]
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
