import { useCallback } from "react";

import { useJazz } from "jazz-react";

import { Task, TodoProject } from "./1_types";

import { SubmittableInput, Button } from "./basicComponents";

import { useSimpleHashRouterThatAcceptsInvites } from "./router";
import { TodoTable } from "./3_TodoTable";
import { CoList } from "cojson";

/** Walkthrough: Creating todo projects & routing in `<App/>`
 *
 *  <App> is the main app component, handling client-side routing based
 *  on the CoValue ID (CoID) of our TodoProject, stored in the URL hash
 *  - which can also contain invite links.
 */

export default function App() {
    // A `LocalNode` represents a local view of loaded & created CoValues.
    // It is associated with a current user account, which will determine
    // access rights to CoValues. We get it from the top-level provider `<WithJazz/>`.
    const { localNode, logOut } = useJazz();

    // This sets up routing and accepting invites, skip for now
    const [currentProjectId, navigateToProjectId] =
        useSimpleHashRouterThatAcceptsInvites<TodoProject>(localNode);

    const createProject = useCallback(
        (title: string) => {
            if (!title) return;

            // To create a new todo project, we first create a `Group`,
            // which is a scope for defining access rights (reader/writer/admin)
            // of its members, which will apply to all CoValues owned by that group.
            const projectGroup = localNode.createGroup();

            // Then we create an empty todo project
            const project = projectGroup.createMap<TodoProject>({
                title,
                tasks: projectGroup.createList<CoList<Task>>()
            });

            navigateToProjectId(project.id);
        },
        [localNode, navigateToProjectId]
    );

    return (
        <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
            {currentProjectId ? (
                <TodoTable projectId={currentProjectId} />
            ) : (
                <SubmittableInput
                    onSubmit={createProject}
                    label="Create New Project"
                    placeholder="New project title"
                />
            )}
            <Button
                onClick={() => {
                    navigateToProjectId(undefined);
                    logOut();
                }}
                variant="outline"
            >
                Log Out
            </Button>
        </div>
    );
}

/** Walkthrough: continue with ./3_TodoTable.tsx */
