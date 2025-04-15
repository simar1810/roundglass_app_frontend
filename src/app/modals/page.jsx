import AddClientDetailsModal from "@/components/modals/AddClientDetailsModal";
import AddClientModal from "@/components/modals/AddClientModal";
import AddPlanModal from "@/components/modals/AddPlanModal";
import AddRecipeModal from "@/components/modals/AddRecipeModal";
import AssignMealModal from "@/components/modals/Assignmealmodal";
import AssignWorkoutModal from "@/components/modals/AssignModal";
import AssignWorkoutAddModal from "@/components/modals/AssignModeladd";
import ClientCreatedNotiModal from "@/components/modals/ClientCreatedNotiModals";
import AddSelectClientModal from "@/components/modals/clientmodal";
import CreateMealModal from "@/components/modals/CreateMealModal";
import NewRecipeModal from "@/components/modals/NewRecipeModal";
import OrderSuccessModal from "@/components/modals/ordersuccessmodal";
import AddPostModal from "@/components/modals/postmodal";
import AddPostModalVideo from "@/components/modals/postmodalvideo";

import ProfileModal from "@/components/modals/ProfileModal";
import RecipieSuccessModal from "@/components/modals/recipiesuccessfullmodel";
import SelectClientModal from "@/components/modals/SelectClientModal";
import ShoppingCartModal from "@/components/modals/shoppingcartmodel";

export default function Page() {
  return <div className="p-20 flex items-center gap-2">
    <AddClientModal/>
    <ClientCreatedNotiModal/>
    <ProfileModal/>
    <AddClientDetailsModal/>
    <AddPostModal/>
    <AddPostModalVideo/>
    <SelectClientModal/>
    <ShoppingCartModal/>
    <OrderSuccessModal/>
    <AddSelectClientModal/>
    <AssignWorkoutModal/>
    <AssignWorkoutAddModal/>
    <AssignMealModal/>
    <RecipieSuccessModal/>
    <NewRecipeModal/>
    <AddPlanModal/>
    <CreateMealModal/>
    <AddRecipeModal/>
  </div>
}