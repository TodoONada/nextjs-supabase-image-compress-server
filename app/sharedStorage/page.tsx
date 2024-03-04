import SharedStorageApp from "@/components/sharedStorageApp";
export default function SharedStorage() {
  return (
    <>
      <h1 className="mb-4 pt-28 text-4xl text-center">共有ストレージ</h1>
      <div className="flex-1 w-full flex flex-col items-center">
        <SharedStorageApp />
      </div>
    </>

  );
}