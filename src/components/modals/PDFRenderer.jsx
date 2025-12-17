"use client"
import MembershipInvoicePDF from "@/components/modals/MembershipInvoicePDF";
import PDFComparison from "@/components/pages/coach/client/PDFComparison";
import PDFShareStatistics from "@/components/pages/coach/client/PDFShareStatistics";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPersonalBranding } from "@/lib/fetchers/app";
import { getBase64ImageFromUrl } from "@/lib/image";
import { useAppSelector } from "@/providers/global/hooks";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ContentError from "../common/ContentError";
import ContentLoader from "../common/ContentLoader";
import PDFCustomMealCompactLandscape from "../pages/coach/meals/PDFCustomMealCompactLandscape";
import PDFCustomMealCompactPortrait from "../pages/coach/meals/PDFCustomMealCompactPortrait";
import PDFCustomMealLandscape from "../pages/coach/meals/PDFCustomMealLandscape";
import PDFCustomMealPortrait from "../pages/coach/meals/PDFCustomMealPortrait";
import PDFDailyMealSchedule from "../pages/coach/meals/PDFDailyMealSchedule";
import PDFInvoice from "../pages/coach/meals/PDFInvoice";
import PDFMealPlan from "../pages/coach/meals/PDFMealPlan";
import PDFSalesReport from "../pages/coach/retail/PDFSalesReport";

const Templates = {
  PDFComparison,
  PDFShareStatistics,
  PDFInvoice,
  PDFMealPlan,
  PDFDailyMealSchedule,
  PDFCustomMealPortrait,
  PDFCustomMealLandscape,
  PDFCustomMealCompactLandscape,
  PDFCustomMealCompactPortrait,
  MembershipInvoicePDF,
  PDFSalesReport
}

export default function PDFRenderer({ children, pdfTemplate, data, open, onOpenChange }) {
  const Component = Templates[pdfTemplate]
  // If open/onOpenChange are provided, use controlled dialog, otherwise uncontrolled
  const dialogProps = open !== undefined && onOpenChange !== undefined
    ? { open, onOpenChange }
    : {};

  return <Dialog {...dialogProps}>
    {children}
    <DialogContent className="h-[95vh] min-w-[95vw] border-b-0 p-0 block gap-0 overflow-y-auto">
      <DialogHeader className="p-0 z-100">
        <DialogTitle className="text-[24px]" />
        <DialogDescription className="sr-only">PDF Document Viewer</DialogDescription>
      </DialogHeader>
      <Container
        Component={Component}
        pdfData={data}
      />
    </DialogContent>
  </Dialog>
}

function Container({ Component, pdfData }) {
  const obtainedPhoto = useAppSelector(state => state?.coach?.data?.profilePhoto) || "";
  const finalProfilePhoto = obtainedPhoto && obtainedPhoto !== "" ? obtainedPhoto : pdfData?.coachProfileImage || ""
  const [brandLogo, setBrandLogo] = useState("");
  const [coachLogo, setCoachLogo] = useState("");
  const [signatureBase64, setSignatureBase64] = useState("");
  const [bankQRImage, setBankQRImage] = useState("")
  const { isLoading, error, data } = useSWR("app/personalBranding", getPersonalBranding);

  const brands = Array.isArray(data?.data) ? data.data : [];

  useEffect(() => {
    const signatureUrl = pdfData?.invoiceMeta?.signature;
    if (!signatureUrl) {
      setSignatureBase64("");
    }

    let cancelled = false;
    getBase64ImageFromUrl(signatureUrl)
      .then((base64) => {
        if (!cancelled) setSignatureBase64(base64);
      })
      .catch(() => {
        if (!cancelled) setSignatureBase64("");
      });

    return () => {
      cancelled = true;
    };
  }, [pdfData?.invoiceMeta?.signature]);

  useEffect(() => {
    const qrLink = pdfData?.invoiceMeta?.qr;
    if (!qrLink) {
      setBankQRImage("");
    }

    let cancelled = false;
    getBase64ImageFromUrl(qrLink)
      .then((base64) => {
        if (!cancelled) setBankQRImage(base64);
      })
      .catch(() => {
        if (!cancelled) setBankQRImage("");
      });

    return () => {
      cancelled = true;
    };
  }, [pdfData?.invoiceMeta?.qr]);

  useEffect(function () {
    const latestBrand = brands.length > 0 ? brands[brands.length - 1] : null;

    if (latestBrand?.brandLogo) {
      getBase64ImageFromUrl(latestBrand.brandLogo)
        .then(setBrandLogo)
        .catch(() => setBrandLogo(""));
    }

    if (finalProfilePhoto) {
      getBase64ImageFromUrl(finalProfilePhoto)
        .then(setCoachLogo)
        .catch(() => setCoachLogo(""));
    }
  }, [brands, finalProfilePhoto])

  const primaryBrand = brands[0] || {};
  const latestBrand = brands.length > 0 ? brands[brands.length - 1] : {};
  const primaryColor = latestBrand?.primaryColor ? `#${latestBrand.primaryColor.slice(-6)}` : "#67BC2A";
  const textColor = latestBrand?.textColor ? `#${latestBrand.textColor.slice(-6)}` : "#ffffff";

  const pdfDataWithSignature = useMemo(() => ({
    ...pdfData,
    invoiceMeta: {
      ...(pdfData?.invoiceMeta ?? {}),
      signatureBase64: signatureBase64 || "",
      qrBase64: bankQRImage || ""
    }
  }), [pdfData, signatureBase64, bankQRImage]);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error?.message || data?.message} />

  return <Component
    data={pdfDataWithSignature}
    brand={{
      ...primaryBrand,
      brandLogo,
      coachLogo,
      primaryColor,
      textColor
    }}
  />
}
