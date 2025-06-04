"use client"
import PDFComparison from "@/components/pages/coach/client/PDFComparison";
import PDFShareStatistics from "@/components/pages/coach/client/PDFShareStatistics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PDFViewer } from "@react-pdf/renderer";
import PDFInvoice from "../pages/coach/meals/PDFInvoice";
import PDFMealPlan from "../pages/coach/meals/PDFMealPlan";

const Templates = {
  PDFComparison,
  PDFShareStatistics,
  PDFInvoice,
  PDFMealPlan
}

export default function PDFRenderer({ children, pdfTemplate, data }) {
  const Component = Templates[pdfTemplate]
  return <Dialog>
    {children}
    <DialogContent className="h-[95vh] min-w-[95vw] border-b-0 p-0 block gap-0 overflow-y-auto">
      <DialogHeader className="p-0 z-100">
        <DialogTitle className="text-[24px]" />
      </DialogHeader>
      {PDFViewer && <Component data={data} />}
    </DialogContent>
  </Dialog>
}