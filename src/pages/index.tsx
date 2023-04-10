import { type NextPage } from "next";
import { SignInButton, useUser, SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { useState } from "react";
import { PageLayout } from "~/components/Layout/layout";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/Loading/loading";
import { toast } from "react-hot-toast";
import Link from "next/link";
dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number]

const PostView = (props: PostWithUser) => {
  const { post, author } = props
  return <div className="flex flex-col">
    <div key={post.id} className="p-4 gap-3 border-b border-slate-400 flex">
      <Image src={author.profileImageUrl} alt={`@${author.username} Profile Picture"`} className="w-14 h-14 rounded-full" width={56} height={56} />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <Link href={`/@${author.username}`}><span>{`@${author.username}`}</span></Link>
          <Link href={`/post/${post.id}`}><span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span></Link>
        </div>
        <span className="texl-2xl">{post.content}</span>
      </div>
    </div>
  </div>
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />

  if (!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  )
}

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("")
  const ctx = api.useContext()

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => { setInput(""); void ctx.posts.getAll.invalidate() },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content
      console.log(errorMessage)
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post. Try again later.")
      }
    }
  })

  if (!user) return null

  return <div className="flex gap-3 w-full">
    <Image src={user.profileImageUrl} alt="Profile Image" className="w-14 h-14 rounded-full" width={56} height={56} />
    <input
      type="text"
      placeholder="Add a twit"
      className="bg-transparent grow outline-none"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      disabled={isPosting}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input !== "") {
            mutate({ content: input });
          }
        }
      }} />
    {input !== "" && !isPosting && <button onClick={() => { mutate({ content: input }); }}>Twit</button>}
    {isPosting && <div className="flex items-center justify-center"><LoadingSpinner size={20} /></div>}
  </div>
}

const Home: NextPage = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // Start fetching asap
  api.posts.getAll.useQuery();

  // Return empty div if user isn't loaded
  if (!userLoaded) return <div />

  return (
    <>
      <PageLayout>
        <div className="border-b border-slate-400 p-4">
          {!isSignedIn && (
            <div className="flex justify-center">]
              <SignInButton redirectUrl="/">
                Sign in
              </SignInButton>
            </div>
          )}
          {!!isSignedIn &&
            <CreatePostWizard />
          }
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
