export const feedTypes = ["global", "our", "both"];
export const displayedPostsType = ["all", "saved"];
export const newPostFields = ["file1", "video", "caption", "type", "contentType"];

export const feedDataInitialState = {
  type: "global", // e.g. "global", "our", "both"
  displayedPostsType: "all", // e.g. all, saved
  page: 1,
  newPostFormData: {
    file1: null,
    caption: "",
    type: "our",
    contentType: "img",
    video: ""
  }
}