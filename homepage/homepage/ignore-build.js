import { execSync } from "child_process";

// Get the current branch name from environment variables or Git
const branchName =
  process.env.VERCEL_GIT_COMMIT_REF ||
  execSync("git rev-parse --abbrev-ref HEAD").toString().trim();

// Allow builds for the "main" branch or branches including "docs"
if (branchName === "main" || branchName.includes("docs")) {
  console.log(`✅ Proceeding with build for branch: ${branchName}`);
  process.exit(1); // Proceed with build
}

// Skip builds for all other branches
console.log(`🛑 Ignoring build for branch: ${branchName}`);
process.exit(0); // Skip build.
