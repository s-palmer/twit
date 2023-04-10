import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  /**
   * Optional prefix for the keys used in redis. This is useful if you want to share a redis
   * instance with other applications and want to avoid key collisions. The default prefix is
   * "@upstash/ratelimit"
   */
  prefix: "@upstash/ratelimit",
});

import type { Post } from "@prisma/client";

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (await clerkClient.users.getUserList({
    userId: posts.map((post) => post.authorId),
    limit: 100,
  })).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author || !author.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not find author for post"
      });
    }

    return {
      post,
      author: {
        ...author,
        username: author.username,
      }
    }
  });
}

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({ take: 100, orderBy: { createdAt: "desc" } });

    return addUserDataToPosts(posts);
  }),
  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.post.findMany({
        where: {
          authorId: input.userId,
        },
        take: 100,
        orderBy: { createdAt: "desc" }
      }).then(addUserDataToPosts)
    )
  ,
  create: privateProcedure.input(z.object({
    content: z.string({
      required_error: "Please enter your Twit.",
      invalid_type_error: "Please enter a valid Twit.",
    }).min(1, { message: "Twit must be 1 or more characters long" }).max(255, { message: "Your Twit is too long." }),
  })).mutation(async ({ ctx, input }) => {
    const authorId = ctx.currentUser;

    const { success } = await ratelimit.limit(authorId);

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "You are posting too fast",
      });
    }

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      }
    })
    return post
  })
});
