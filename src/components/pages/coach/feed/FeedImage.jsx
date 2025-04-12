import Image from "next/image";
import FeedFooter from "./FeedFooter";
import FeedHeader from "./FeedHeader";

export default function FeedImage() {
  return <div>
    <FeedHeader />
    <div className="relative aspect-[4/3] bg-black">
      <Image
        src="/"
        fill
        alt=""
        className="object-cover"
      />
    </div>
    <FeedFooter />
  </div>
}