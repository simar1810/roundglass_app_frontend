import { format } from "date-fns";
import { fetchData } from "../api";

export function getCoachProfile(_id) {
  return fetchData(`app/coachProfile?id=${_id}`);
}

export function getCoachHome() {
  return fetchData('app/coachHomeTrial');
}

export function coachMatricesData() {
  return fetchData('app/activity/get?person=coach');
}

export async function dashboardStatistics(router, cache) {
  const response = await fetchData('app/coach-statistics');
  if (response?.status_code === 411) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fetch("/api/logout", { method: "DELETE" });
    for (const [field] of cache.entries()) {
      cache.delete(field)
    }
    router.push("/login");
    return;
  }
  return response;
}

export function getCoachNotifications() {
  return fetchData('app/notification?person=coach');
}

export function getCoachSocialLinks() {
  return fetchData('app/sm');
}

export function getMeals(searchQuery) {
  return fetchData(`app/getMeal?query=${searchQuery}`);
}

export function getRecipes() {
  return fetchData("app/getRecipes?person=coach");
}

export function getPlans() {
  return fetchData("app/plans");
}

export function getOrganisation() {
  return fetchData("app/getOrganisation");
}

export function getAppClients(query) {
  let queries = ""
  if (query?.page) queries += "page=" + query.page + "&";
  if (query?.limit) queries += "limit=" + query.limit + "&";
  if (query?.isActive) queries += "isActive=" + query.isActive + "&";
  return fetchData(`app/allClient?${queries}`);
}

export function getAppClientPortfolioDetails(_id) {
  return fetchData(`app/clientProfile?id=` + _id);
}

export function getClientStatsForCoach(clientId) {
  return fetchData(`app/clientStatsCoach?clientId=${clientId}`);
}

export function getClientMealPlanById(_id) {
  return fetchData(`app/get-plan-by-id?clientId=${_id}`);
}

export function getClientOrderHistory(clientId) {
  return fetchData(`app/client-order-history?clientId=${clientId}`);
}

export function getAppFeeds(state) {
  const query = `page=${state.page}&type=${state.type}`;
  return fetchData("app/feeds2?person=coach&" + query);
}

export function getAppPersonalFeeds(state) {
  const query = `page=${state.page}`;
  return fetchData("app/my-posts?person=coach&" + query);
}

export function getFeedComments(postId) {
  return fetchData(`app/get-comments?postId=${postId}`);
}

export function getRetail() {
  return fetchData("app/coach-retail");
}

export function getOrderHistory() {
  return fetchData("app/order-history");
}

export function getNotes() {
  return fetchData("app/notes?person=coach");
}

export function getReminders() {
  return fetchData("app/getAllReminder?person=coach");
}

export function getRecipesCalorieCounter(query) {
  return fetchData(`app/recipees?query=${query}`);
}

export function getAllChatClients() {
  return fetchData("app/getAllChatClients");
}

export function getPersonalBranding() {
  return fetchData("app/list?person=coach");
}

export function getClientForMeals(planId) {
  return fetchData(`app/getClientForMeals?planId=${planId}`);
}

export function getProductByBrand(brandId) {
  return fetchData(`app/getProductByBrand/${brandId}`);
}

export function getWorkouts() {
  return fetchData("app/workout/coach/workoutCollections");
}

export function getMarathons() {
  return fetchData("app/marathon/coach/listMarathons");
}

export function getMarathonLeaderBoard(marathonId) {
  return fetchData(`app/marathon/coach/points?person=coach&marathonId=${marathonId}`);
}

export function getMarathonClientTask(clientId, date = format(new Date(), "dd-MM-yyyy")) {
  return fetchData(`app/marathon/coach/viewProgress?clientId=${clientId}&date=${date}`);
}

export function getMealPlanById(id) {
  return fetchData(`app/get-plan-by-id?id=${id}`)
}

export function getSyncCoachesList() {
  return fetchData("app/sync-coach/super")
}

export function getSyncedCoachesClientList(coachId) {
  return fetchData(`app/sync-coach/super/client?coachId=${coachId}`);
}

export function getMarathonTaskOptions() {
  return fetchData("app/marathon/coach/task-options");
}

export function getClientsForMarathon(marathonId) {
  return fetchData(`app/marathon/coach/getClientsForMarathon?marathonId=${marathonId}`);
}

export function getClientsForWorkout(workoutId) {
  return fetchData(`app/workout/coach/getClientForWorkouts?workoutCollectionId=${workoutId}`);
}

export function getAllWorkoutItems() {
  return fetchData("app/workout/coach/getAllWorkoutsItems");
}

export function getWorkoutDetails(workoutId) {
  return fetchData(`app/workout/client/getWorkout?id=${workoutId}&person=coach`);
}

export function getAllSubscriptions() {
  return fetchData("app/allCoachSubscriptions");
}