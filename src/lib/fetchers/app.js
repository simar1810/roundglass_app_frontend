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