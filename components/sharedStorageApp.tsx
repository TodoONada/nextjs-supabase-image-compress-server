"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function ImageApp() {
  const public_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/shared-bucket/shared-folder/`;
  const supabase = createClientComponentClient();
  const [urlList, setUrlList] = useState<string[]>([]);
  const [loadingState, setLoadingState] = useState("hidden");

  const diffOverMinute = (timestamp1: Date, timestamp2: Date) => {
    const difference = timestamp1.getTime() - timestamp2.getTime();

    // 差が60000ミリ秒（= 1分）以上であるか確認
    if (difference >= 60000) {
      return true;
    } else {
      return false;
    }
  };

  const limitUploadCount = async () => {
    const { data, error } = await supabase.storage
      .from("shared-bucket")
      .list("shared-folder", {
        limit: 10,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.log(error);
      return;
    }

    if (data.length == 10) {
      const isDiffOverMinute = diffOverMinute(
        new Date(data[0].created_at),
        new Date(data[9].created_at)
      );

      return isDiffOverMinute;
    } else {
      return true;
    }
  };

  const listAllImage = async () => {
    const tempUrlList: string[] = [];
    setLoadingState("flex justify-center");
    const { data, error } = await supabase.storage
      .from("shared-bucket")
      .list("shared-folder", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) {
      console.log(error);
      return;
    }

    for (let index = 0; index < data.length; index++) {
      if (data[index].name != ".emptyFolderPlaceholder") {
        tempUrlList.push(data[index].name);
      }
    }
    setUrlList(tempUrlList);
    setLoadingState("hidden");
  };

  useEffect(() => {
    (async () => {
      await listAllImage();
    })();
  }, []);

  const [file, setFile] = useState<File>();
  const handleChangeFile = (e: any) => {
    if (e.target.files.length !== 0) {
      setFile(e.target.files[0]);
    }
  };

  const onSubmit = async (event: any) => {
    event.preventDefault();

    const isDiffOverMinute = await limitUploadCount();
    // 直近1分間に画像を10ファイル以上アップロードさせない
    if (!isDiffOverMinute) {
      alert(
        "画像ファイルのアップロード制限がかかっています。時間をあけてアップロードしてください"
      );
      return;
    }

    if (file!!.type.match("image.*")) {
      const fileExtension = file!!.name.split(".").pop();
      const { error } = await supabase.storage
        .from("shared-bucket")
        .upload(`shared-folder/${uuidv4()}.${fileExtension}`, file!!);
      if (error) {
        alert("エラーが発生しました：" + error.message);
        return;
      }
      setFile(undefined);
      await listAllImage();
    } else {
      alert("画像ファイル以外はアップロード出来ません。");
    }
  };
  return (
    <>
      <form className="mb-4 text-center" onSubmit={onSubmit}>
        <input
          className="relative mb-4 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-base font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200 focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none"
          type="file"
          id="formFile"
          accept="image/*"
          onChange={(e) => {
            handleChangeFile(e);
          }}
        />
        <button
          type="submit"
          disabled={file == undefined}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25"
        >
          送信
        </button>
      </form>
      <div className="w-full max-w-3xl">
        <div className={loadingState} aria-label="読み込み中">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
        <ul className="flex flex-wrap w-full">
          {urlList.map((item, index) => (
            <li className="w-1/4 h-auto p-1" key={item}>
              <a
                className="hover:opacity-50"
                href={public_url + item + "?quality=50&format=origin"}
                target="_blank"
              >
                <img
                  className="object-cover max-h-32 w-full"
                  src={
                    public_url + item + "?width=200&quality=50&resize=contain"
                  }
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
