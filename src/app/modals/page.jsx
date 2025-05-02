import AddClientDetailsModal from "@/components/modals/AddClientDetailsModal";
import AddClientModal from "@/components/modals/AddClientModal";
import AddRecipeModal from "@/components/modals/AddRecipeModal";
import AssignWorkoutModal from "@/components/modals/AssignModal";
import AssignWorkoutAddModal from "@/components/modals/AssignModeladd";
import ClientCreatedNotiModal from "@/components/modals/ClientCreatedNotiModals";
import AddSelectClientModal from "@/components/modals/clientmodal";
import CreateMealModal from "@/components/modals/CreateMealModal";
import NewRecipeModal from "@/components/modals/NewRecipeModal";
import OrderSuccessModal from "@/components/modals/ordersuccessmodal";
// import AddPostModal from "@/components/modals/AddPostmodal";
import AddPostModalVideo from "@/components/modals/postmodalvideo";

import ProfileModal from "@/components/modals/ProfileModal";
import RecipieSuccessModal from "@/components/modals/recipiesuccessfullmodel";
import SelectClientModal from "@/components/modals/SelectClientModal";
import ShoppingCartModal from "@/components/modals/shoppingcartmodel";

export default function Page() {
  return <div className="p-20 grid grid-cols-8 items-center gap-2">
    <ShoppingCartModal />
    <OrderSuccessModal />
    <AddSelectClientModal />
    <AssignWorkoutModal />
    <AssignWorkoutAddModal />
    <RecipieSuccessModal />
    <NewRecipeModal />
    <CreateMealModal />
    <AddRecipeModal />
  </div>
}