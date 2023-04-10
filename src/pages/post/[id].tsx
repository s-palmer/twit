import { type NextPage } from "next";
import Head from "next/head";

const SinglePostPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex justify-center h-screen">
        <div className="border-slate-400 h-full w-full md:max-w-2xl border-x">
          Single Post Page
        </div>
      </main>
    </>
  );
};

export default SinglePostPage;
 