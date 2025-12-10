"use client";
import useSWR, { mutate } from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import ContentError from "@/components/common/ContentError";
import PDFRenderer from "@/components/modals/PDFRenderer";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchData, sendDataWithFormData } from "@/lib/api";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSelector } from "@/providers/global/hooks";

export default function Page() {
  const [query, setQuery] = useState("")
  const { isLoading, error, data } = useSWR(
    "membership/invoices",
    () => fetchData("app/memberships-invoices")
  );
  const { invoiceMeta } = useAppSelector(state => state.coach.data)

  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error?.message || data.message} />
  const subscriptions = createSubscriptionList(data?.data);

  if (subscriptions.length === 0) {
    return (
      <div className="content-container content-height-screen">
        <h4>Membership Subscriptions</h4>
        <ContentError className="mt-6" title="No subscriptions available" />
      </div>
    );
  }

  const regex = new RegExp(query, "i")
  const filteredMemberships = subscriptions?.filter(membership => regex.test(membership?.clientName));

  return (
    <div className="content-container content-height-screen">
      <div className="flex items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <h4>Membership Subscriptions</h4>
        {/* <p className="text-sm text-slate-500">{subscriptions.length} subscriptions</p> */}
        <SearchBar query={query} onChange={value => setQuery(value)} />
        <UpdateInvoiceMeta meta={invoiceMeta} />
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow className="[&_th]:text-sm">
            <TableHead>Client</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Invoice PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMemberships.map((subscription, index) => {
            const rowKey = subscription._id ?? subscription.historyId ?? `${subscription.clientName}-${index}`;
            const pdfPayload = {
              subscription: {
                amount: Number(subscription.amount) || 0,
                description: subscription.description || "Membership Subscription",
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                invoice: subscription.invoice,
                paymentMode: subscription.paymentMode,
                discount: Number(subscription.discount) || 0,
                notes: subscription.notes || subscription.description || "Renewal"
              },
              client: {
                name: subscription.clientName,
                phone: subscription.mobileNumber,
                email: subscription.email,
                city: subscription.city
              }
            };
            pdfPayload.invoiceMeta = invoiceMeta ?? {};
            return (
              <TableRow key={rowKey}>
                <TableCell>{subscription.clientName || "-"}</TableCell>
                <TableCell className="max-w-[160px] text-xs text-slate-600 truncate">{subscription.email || "-"}</TableCell>
                <TableCell>{subscription.mobileNumber || "-"}</TableCell>
                <TableCell>{subscription.city || "-"}</TableCell>
                <TableCell>{subscription.invoice || "-"}</TableCell>
                <TableCell>{formatDate(subscription.startDate)}</TableCell>
                <TableCell>{formatDate(subscription.endDate)}</TableCell>
                <TableCell>{(subscription.paymentMode || "-").toString().toUpperCase()}</TableCell>
                <TableCell>{formatCurrency(subscription.amount)}</TableCell>
                <TableCell className="max-w-[200px] text-xs text-slate-600 truncate">{subscription.description || "-"}</TableCell>
                <TableCell className="whitespace-nowrap pr-2">
                  <PDFRenderer pdfTemplate="MembershipInvoicePDF" data={pdfPayload}>
                    <DialogTrigger className="px-3 py-1 rounded-[6px] bg-[var(--accent-1)] text-[12px] font-semibold text-white transition-opacity hover:opacity-90">
                      PDF
                    </DialogTrigger>
                  </PDFRenderer>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filteredMemberships.length === 0 && <div className="min-h-[200px] flex items-center justify-center">
        No invoices found!
      </div>}
    </div>
  );
}

function createSubscriptionList(subscriptions = []) {
  if (!Array.isArray(subscriptions)) return [];
  const result = [];
  for (const item of subscriptions) {
    const client = item.user || {};
    const history = Array.isArray(item.history) ? item.history : [];
    for (const subscription of history) {
      result.push({
        clientName: client.name,
        mobileNumber: client.mobileNumber,
        city: client.city,
        email: client.email,
        ...subscription
      });
    }
  }
  return result;
}

function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function SearchBar({ query, onChange }) {
  return <Input
    value={query}
    onChange={e => onChange(e.target.value)}
    className="max-w-md ml-auto"
    placeholder="search by client name..."
  />
}

function UpdateInvoiceMeta({ meta } = {}) {
  const [loading, setLoading] = useState(false);
  const defaultMeta = createInvoiceMetaPayload(meta);
  const [formValues, setFormValues] = useState(defaultMeta);
  const [signaturePreview, setSignaturePreview] = useState(defaultMeta.signature);
  const [signatureFile, setSignatureFile] = useState(null);
  const previewUrlRef = useRef("");

  useEffect(() => {
    const payload = createInvoiceMetaPayload(meta);
    setFormValues(payload);
    setSignaturePreview(payload.signature);
    setSignatureFile(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  }, [meta]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSignatureFile(null);
      setSignaturePreview(meta?.signature ?? "");
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setSignatureFile(file);
    setSignaturePreview(url);
  };

  const fields = [
    { name: "title", label: "Title" },
    { name: "address", label: "Address" },
    { name: "gstin", label: "GSTIN" },
    { name: "placeOfSupply", label: "Place of Supply" },
    { name: "bankName", label: "Bank Name" },
    { name: "accountNumber", label: "Account Number" },
    { name: "ifscCode", label: "IFSC Code" },
    { name: "branch", label: "Branch" }
  ];

  async function handleSubmit() {
    try {
      setLoading(true);
      const formData = new FormData();
      for (const field of fields) {
        formData.append(field.name, formValues[field.name]);
      }
      if (signatureFile) {
        formData.append("signature", signatureFile);
      }
      const response = await sendDataWithFormData("app/memberships-invoices/meta", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      mutate("coachProfile");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <Dialog>
    <DialogTrigger asChild>
      <Button>Invoice Information</Button>
    </DialogTrigger>
    <DialogContent className="p-0 !max-w-5xl w-full max-h-[75vh] overflow-y-auto">
      <DialogTitle className="p-4 border-b border-slate-200">Invoice Information</DialogTitle>
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.name} className="space-y-1 text-xs text-slate-600">
              <span className="font-medium text-slate-800">{field.label}</span>
              <Input
                name={field.name}
                value={formValues[field.name]}
                onChange={handleInputChange}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            </label>
          ))}
        </div>
        <div className="space-y-2 lg:w-1/2">
          <span className="font-medium text-slate-800 text-sm">Signature Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm text-slate-600"
          />
          {signaturePreview && (
            <div className="mt-2 border border-slate-200 rounded">
              <img
                src={signaturePreview}
                alt="Selected invoice preview"
                className="w-full max-h-64 object-contain rounded"
              />
            </div>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
}

function createInvoiceMetaPayload(meta = {}) {
  return {
    title: meta.title ?? "",
    address: meta.address ?? "",
    gstin: meta.gstin ?? "",
    placeOfSupply: meta.placeOfSupply ?? "",
    signature: meta.signature ?? "",
    bankName: meta.bankName ?? "",
    accountNumber: meta.accountNumber ?? "",
    ifscCode: meta.ifscCode ?? "",
    branch: meta.branch ?? ""
  };
}