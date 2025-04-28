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

export function dashboardStatistics() {
  return fetchData('app/coach-statistics');
}

export function getCoachNotifications() {
  return fetchData('app/notification?person=coach');
}

export function getCoachSocialLinks() {
  return fetchData('app/sm');
}

export function getMeals() {
  return fetchData("app/getMeal");
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
  return fetchData(`app/allClient?page=${query.page}&limit=${query.limit}`);

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