import * as HelloWorldPost from "@/components/blog/posts/1_helloWorld.mdx";
import * as WhatIsJazzPost from "@/components/blog/posts/2_whatIsJazz.mdx";
import * as WhatWeShippedSinceSummerPost from "@/components/blog/posts/3_whatWeShippedSinceSummer.mdx";
import * as TestPost from "@/components/blog/posts/test.mdx";
export const posts: (typeof TestPost)[] = [
  WhatWeShippedSinceSummerPost,
  WhatIsJazzPost,
  HelloWorldPost,
];

export const getPostBySlug = (slug: string) => {
  return posts.find((post) => post.meta.slug === slug);
};
