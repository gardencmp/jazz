import { execSync } from "child_process";

const branchName =
  process.env.VERCEL_GIT_COMMIT_REF ||
  execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const currentAppName = process.env.APP_NAME;
const homepageAppName = "jazz-homepage";

if (
  branchName === "main" &&
  process.env.VERCEL_GIT_COMMIT_MESSAGE?.includes("docs")
) {
  // If merging a "docs" branch into "main" (commit message contains "docs"), skip all apps except "homepage"
  if (currentAppName === homepageAppName) {
    console.log(
      `✅ Building homepage because a "docs" branch was merged into "main".`,
    );
    process.exit(1); // Continue with the build
  } else {
    console.log(
      `🛑 Skipping build for ${currentAppName} after "docs" branch merged to main.`,
    );
    process.exit(0); // Skip the build
  }
} else if (branchName.includes("docs")) {
  // If on a "docs" branch, skip all apps except "homepage"
  if (currentAppName === homepageAppName) {
    console.log(`✅ Building homepage for "docs" branch.`);
    process.exit(1); // Continue with the build
  } else {
    console.log(`🛑 Skipping build for ${currentAppName} on "docs" branch.`);
    process.exit(0); // Skip the build
  }
}

// Default behavior: build everything.
console.log(
  `✅ Proceeding with build for ${currentAppName} on branch ${branchName}.`,
);
process.exit(1);
