import { type NextPage } from "next";
import Head from "next/head";

const ProfilePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>TwitTwoo</title>
        <meta name="description" content="Twit" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="border-slate-400 h-full w-full md:max-w-2xl border-x">
          Profile View
        </div>
      </main>
    </>
  );
};

export default ProfilePage;
