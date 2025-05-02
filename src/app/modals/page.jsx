import AddClientDetailsModal from "@/components/modals/AddClientDetailsModal";
import AddClientModal from "@/components/modals/AddClientModal";
import AddPlanModal from "@/components/modals/AddPlanModal";
import AddRecipeModal from "@/components/modals/AddRecipeModal";
import AssignWorkoutModal from "@/components/modals/AssignModal";
import AssignWorkoutAddModal from "@/components/modals/AssignModeladd";
import AssignNewAppointmentModal from "@/components/modals/AssignNewAppointmentModal";
import BrandingModal from "@/components/modals/BrandingModal";
import ClientCreatedNotiModal from "@/components/modals/ClientCreatedNotiModals";
import AddSelectClientModal from "@/components/modals/clientmodal";
import CreateMealModal from "@/components/modals/CreateMealModal";
import NewAppointmentModal from "@/components/modals/NewAppointmentModal";
import NewNotesModal from "@/components/modals/NewNotesAdd";
import NewRecipeModal from "@/components/modals/NewRecipeModal";
import OrderSuccessModal from "@/components/modals/ordersuccessmodal";
import ProgramModal from "@/components/modals/PorgramModal";
import AddPostModal from "@/components/modals/postmodal";
import AddPostModalVideo from "@/components/modals/postmodalvideo";

import ProfileModal from "@/components/modals/ProfileModal";
import RecipieSuccessModal from "@/components/modals/recipiesuccessfullmodel";
import SelectClientModal from "@/components/modals/SelectClientModal";
import SelectLanguageModal from "@/components/modals/SelectLanguageModal";
import ShoppingCartModal from "@/components/modals/shoppingcartmodel";

export default function Page() {
  return (
    <div className="p-20 flex items-center gap-2">
      <AddClientModal />
      <ClientCreatedNotiModal />
      <ProfileModal />
      <AddClientDetailsModal />
      <AddPostModal />
      <AddPostModalVideo />
      <SelectClientModal />
      <ShoppingCartModal />
      <OrderSuccessModal />
      <AddSelectClientModal />
      <AssignWorkoutModal />
      <AssignWorkoutAddModal />
      <AssignMealModal />
      <RecipieSuccessModal />
      <NewRecipeModal />
      <AddPlanModal />
      <CreateMealModal />
      <AddRecipeModal />
      <NewNotesModal />
      <NewAppointmentModal />
      <AssignNewAppointmentModal />
      <ProgramModal/>
      <SelectLanguageModal/>
      <BrandingModal/>
      
    </div>
  );
}
