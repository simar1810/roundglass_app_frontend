import AddClientDetailsModal from "@/components/modals/AddClientDetailsModal";
import AddClientModal from "@/components/modals/AddClientModal";
import ClientCreatedNotiModal from "@/components/modals/ClientCreatedNotiModals";

import ProfileModal from "@/components/modals/ProfileModal";

export default function Page() {
  return <div className="p-20 flex items-center gap-2">
    <AddClientModal/>
    <ClientCreatedNotiModal/>
    <ProfileModal/>
    <AddClientDetailsModal/>
  </div>
}