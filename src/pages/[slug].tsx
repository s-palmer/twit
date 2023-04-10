import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/Layout/layout";
import Image from "next/image";
import { PostView } from "~/components/Post/postview";

const ProfileFeed = (props: { userId: string }) => {

  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({ userId: props.userId })

  if (isLoading) return <LoadingPage />

  if (!data || data.length === 0) return <div>No posts found...</div>

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}

    </div>
  )
}

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {

  const { data } = api.profile.getUserByUsername.useQuery({ username: username })

  if (!data) return <div>404</div>

  console.log(data.id)

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="bg-slate-600 h-36 relative">
          <Image
            src={data.profileImageUrl}
            alt={`${data.username ?? ""}'s profile pic`}
            width={128}
            height={128}
            className="rounded-full -mb-16 absolute bottom-0 left-0 ml-4 border-4 border-black bg-black"
          />
        </div>
        <div className="h-16"></div>
        <div className="p-4 text-2xl">{`@${data.username ?? ""}`}</div>
        <div className="border-b border-slate-400 w-full"></div>
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import { prisma } from "~/server/db";
import superjson from 'superjson';
import { LoadingPage } from "~/components/Loading/loading";

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") {
    throw new Error("no slug");
  }

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username: username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    }
  }
}

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
}

export default ProfilePage;
