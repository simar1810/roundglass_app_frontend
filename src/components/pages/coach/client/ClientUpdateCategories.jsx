import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppSelector } from "@/providers/global/hooks";
import { useMemo } from "react";

export default function ClientUpdateCategories({
  onClose,
  defaultOpen,
  clientData
}) {
  console.log(clientData)
  const { client_categories } = useAppSelector(state => state.coach.data);

  const categories = useMemo(() => {
    const map = new Map();
    for (const category of client_categories) {
      map.set(category._id, category.name)
    }
    return map;
  })

  console.log(categories)

  return <Dialog>
    <DialogTrigger asChild>
      <Button variant="wz">Categories</Button>
    </DialogTrigger>
    <DialogContent className="gap-0 p-0">
      <DialogTitle className="p-4 border-b-1">Categories</DialogTitle>
      <div className="p-4"></div>
    </DialogContent>
  </Dialog>
}