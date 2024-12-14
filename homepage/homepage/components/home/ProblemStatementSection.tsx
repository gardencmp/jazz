import { DiagramAfterJazz } from "@/components/DiagramAfterJazz";
import { DiagramBeforeJazz } from "@/components/DiagramBeforeJazz";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

export default function ProblemStatementSection() {
  return (
    <div className="container grid gap-4 lg:gap-8">
      <SectionHeader
        className="sm:text-center sm:mx-auto"
        title="Hard things are easy now."
        slogan=""
      />

      <div className="grid sm:grid-cols-2 border rounded-lg shadow-sm md:rounded-xl overflow-hidden dark:border-stone-900">
        <div className="flex flex-col bg-stone-50 relative gap-3 p-4 pb-8 md:p-8 md:gap-5 border-b sm:border-b-0 sm:border-r dark:bg-transparent dark:border-stone-900">
          <span className="hidden absolute top-0 -right-4 md:-right-6 sm:flex items-center h-full">
            <span className="p-1 md:p-3 bg-stone-200 rounded-full dark:bg-stone-900 dark:text-white">
              <Icon name="arrowRight" />
            </span>
          </span>
          <span className="sm:hidden w-full absolute -bottom-6 flex justify-center left-0">
            <span className="p-3 bg-stone-200 rounded-full dark:bg-stone-900 dark:text-white">
              <Icon name="arrowDown" />
            </span>
          </span>
          <Prose>
            <p className="font-display text-lg md:text-xl font-semibold text-stone-900 dark:text-white">
              The sad truth is...
            </p>
            <p>
              <strong>
                Every stack reinvents how users and machines share state.
              </strong>
            </p>
          </Prose>
          <div className="relative flex items-center flex-1">
            <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-950"></div>
            <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-950"></div>
            <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-950"></div>
            <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-950"></div>

            <DiagramBeforeJazz className="mx-auto w-full h-auto max-w-sm" />
          </div>
          <Prose>
            <p>
              For each new app you tackle a{" "}
              <strong>
                mess of moving parts, tech choices &amp; deployment woes.
              </strong>{" "}
              Your code? <strong>All over the place.</strong>
            </p>
            <p>
              <strong>It’s holding you back</strong> from shipping{" "}
              <strong>what your app could be.</strong>
            </p>
          </Prose>
        </div>
        <div className="flex flex-col gap-3 p-4 pt-8 md:p-8 md:gap-5">
          <Prose>
            <p className="font-display text-lg md:text-xl font-semibold text-stone-900 dark:text-white">
              The good news is...
            </p>
            <p>
              <strong>
                There’s a single new abstraction that does the whole job.
              </strong>
            </p>
          </Prose>
          <div className="flex items-center flex-1">
            <DiagramAfterJazz className="mx-auto w-full h-auto max-w-sm" />
          </div>
          <Prose>
            <p>
              Jazz gives you <strong>mutable local state</strong> that’s{" "}
              <strong>instantly synced.</strong> Including binary blobs.{" "}
              <strong>With users &amp; permissions built-in.</strong>
            </p>
            <p>
              All that’s left is{" "}
              <strong>building the UX that makes your app special.</strong>
            </p>
          </Prose>
        </div>
      </div>
    </div>
  );
}
