export default function YouTubeEmbed({ videoId }) {
  if (!videoId) return <></>
  return (
    <iframe
      src={videoId}
      key={videoId}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className="w-full h-full aspect-video"
    />
  );
};