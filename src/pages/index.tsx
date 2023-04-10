import { type NextPage } from "next";
import Head from "next/head";
import { SignInButton, useUser, SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
dayjs.extend(relativeTime);

const Home: NextPage = () => {
  const user = useUser();

  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>Something went wrong</div>;

  const CreatePostWizard = () => {
    const { user } = useUser();

    if (!user) return null

    return <div className="flex gap-3 w-full">
      <Image src={user.profileImageUrl} alt="Profile Image" className="w-14 h-14 rounded-full" width={56} height={56} />
      <input type="text" placeholder="Add a twit" className="bg-transparent grow outline-none" />
    </div>
  }

  type PostWithUser = RouterOutputs["posts"]["getAll"][number]


  const PostView = (props: PostWithUser) => {
    const { post, author } = props
    return <div className="flex flex-col">
      <div key={post.id} className="p-4 gap-3 border-b border-slate-400 flex">
        <Image src={author.profileImageUrl} alt={`@${author.username} Profile Picture"`} className="w-14 h-14 rounded-full" width={56} height={56} />
        <div className="flex flex-col">
          <div className="flex text-slate-300 gap-1">
            <span>{`@${author.username}`}</span>
            <span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span>
          </div>
          <span>{post.content}</span>
        </div>
      </div>
    </div>
  }

  return (
    <>
      <Head>
        <title>TwitTwoo</title>
        <meta name="description" content="Twit" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="border-slate-400 h-full w-full md:max-w-2xl border-x">
          <div className="border-b border-slate-400 p-4">
            {!user.isSignedIn && (
              <div className="flex justify-center">]
                <SignInButton redirectUrl="/">
                  Sign in
                </SignInButton>
              </div>
            )}
            {!!user.isSignedIn &&
              <CreatePostWizard />
            }
          </div>
          <div className="flex flex-col">
            {[...data, ...data]?.map((fullPost) => (
              <PostView {...fullPost} key={fullPost.post.id} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
