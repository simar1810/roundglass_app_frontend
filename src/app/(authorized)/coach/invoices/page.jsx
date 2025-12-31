"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import PDFRenderer from "@/components/modals/PDFRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchData, sendDataWithFormData } from "@/lib/api";
import { useAppSelector } from "@/providers/global/hooks";
import { Download, FileText, Filter, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";

function isPaymentCompleted(item) {
  if (item.paidAmount == null) return true
  if (item.paidAmount < item.amount) return false
  return true
}

function filterBasedOnInvoiceType(invoice, filter) {// filters = completed, pending
  if (filter.length === 2) return invoice;
  if (filter.includes("completed")) return isPaymentCompleted(invoice)
  if (filter.includes("pending")) return !isPaymentCompleted(invoice)
  return false
}

export default function Page() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFields, setActiveFields] = useState(["clientName", "email", "mobileNumber", "invoice", "city", "description"]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [invoiceType, setInvoiceType] = useState(["pending", "completed"]) // all, pending, completed
  const { isLoading, error, data } = useSWR(
    "membership/invoices",
    () => fetchData("app/memberships-invoices")
  );
  const invoiceMeta = data?.invoiceMeta || {};
  
  // Check which invoice fields are missing
  const getMissingFields = (meta) => {
    const missing = [];
    if (!meta?.title?.trim()) missing.push("Company Name");
    if (!meta?.gstin?.trim()) missing.push("GSTIN");
    if (!meta?.address?.trim()) missing.push("Address");
    // Check if GST is missing - it can be 0, so we check for null/undefined/empty string
    // Also check if it's a valid number (including 0)
    const gstValue = meta?.gst;
    const gstNum = gstValue !== null && gstValue !== undefined && gstValue !== "" 
      ? parseFloat(String(gstValue)) 
      : null;
    // GST is missing if it's null/undefined/empty OR if it's not a valid number
    if (gstNum === null || isNaN(gstNum)) {
      missing.push("GST Percentage");
    }
    return missing;
  };

  const missingFields = getMissingFields(invoiceMeta);
  const hasMissingFields = missingFields.length > 0;
  if (isLoading) return <ContentLoader />

  if (error || data.status_code !== 200) return <ContentError title={error?.message || data.message} />
  const subscriptions = createSubscriptionList(data?.data);
  const stats = createInvoiceStats(subscriptions);

  if (subscriptions.length === 0) {
    return (
      <div className="content-container content-height-screen">
        <h4>Membership Subscriptions</h4>
        <ContentError className="mt-6" title="No subscriptions available" />
      </div>
    );
  }

  const regex = new RegExp(query, "i")
  const filteredMemberships = subscriptions
    ?.filter(membership => {
      if (paymentFilter !== "all") {
        const mode = (membership?.paymentMode || "").toString().toLowerCase();
        if (mode !== paymentFilter) return false;
      }

      if (!query) return true;
      const haystack = [
        activeFields.includes("clientName") && membership?.clientName,
        activeFields.includes("email") && membership?.email,
        activeFields.includes("mobileNumber") && membership?.mobileNumber,
        activeFields.includes("invoice") && membership?.invoice,
        activeFields.includes("city") && membership?.city,
        activeFields.includes("description") && membership?.description
      ].filter(Boolean).join(" ");
      return regex.test(haystack);
    })
    .filter(item => filterBasedOnInvoiceType(item, invoiceType));

  return (
    <div className="content-container content-height-screen space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <h4 className="leading-tight">Membership Invoices</h4>
        </div>
        <div className="flex w-full gap-3 md:w-auto md:items-center">
          <SearchBar
            query={query}
            onChange={value => setQuery(value)}
            activeFields={activeFields}
            onToggleField={setActiveFields}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={setPaymentFilter}
            invoiceType={invoiceType}
            onInvoiceTypeChange={setInvoiceType}
          />
          <UpdateInvoiceMeta meta={invoiceMeta} />
        </div>
      </div>

      <InvoiceHighlights stats={stats} total={subscriptions.length} />

      {hasMissingFields && (
        <InvoiceInfoNotification 
          missingFields={missingFields} 
          onUpdate={() => router.push("/coach/portfolio")}
        />
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 bg-slate-50">
                <TableHead className="pl-4">Client</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right pr-4">Amount</TableHead>
                <TableHead className="text-right pr-5">Invoice PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.map((subscription, index) => {
                const rowKey = subscription._id ?? subscription.historyId ?? `${subscription.clientName}-${index}`;
                const paidAmount = Number(subscription.paidAmount ?? subscription.amount ?? 0);
                const totalAmount = Number(subscription.amount ?? 0);
                const pendingAmount = Math.max(totalAmount - paidAmount, 0);
                const pdfPayload = {
                  subscription: {
                    amount: Number(subscription.amount) || 0,
                    description: subscription.description || "Membership Subscription",
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    invoice: subscription.invoice,
                    paymentMode: subscription.paymentMode,
                    discount: Number(subscription.discount) || 0,
                    notes: subscription.notes || subscription.description || "Renewal",
                    paidAmount: Number(subscription.paidAmount ?? subscription.amount ?? 0)
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
                  <TableRow key={rowKey} className="align-top">
                    <TableCell className="pl-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">{subscription.clientName || "-"}</p>
                        <p className="text-xs text-slate-600">{subscription.email || "No email"}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span>{subscription.mobileNumber || "-"}</span>
                          {subscription.city && (
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[11px] font-medium">
                              {subscription.city}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {subscription.invoice ? (
                          <Badge variant="outline" className="w-fit border-slate-200">
                            Invoice #{subscription.invoice}
                          </Badge>
                        ) : null}
                        <p className="text-xs text-slate-600 max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {subscription.description || "Membership subscription"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">{formatDate(subscription.startDate)} — {formatDate(subscription.endDate)}</div>
                      {subscription.notes && (
                        <p className="text-xs text-slate-600 mt-1 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {subscription.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <PaymentBadge mode={subscription.paymentMode} />
                    </TableCell>
                    <TableCell className="text-right pr-4 font-semibold text-slate-900">
                      <div className="space-y-1">
                        <div className="text-sm">{formatCurrency(totalAmount)}</div>
                        <div className="flex justify-end gap-1 text-[11px] text-slate-600">
                          <Badge variant="wz_fill" className="px-2 py-0 h-6 text-[11px] flex items-center">
                            Paid {formatCurrency(paidAmount)}
                          </Badge>
                          {pendingAmount > 0 && (
                            <Badge variant="outline" className="px-2 py-0 h-6 text-[11px] flex items-center border-amber-200 bg-amber-50 text-amber-800">
                              Pending {formatCurrency(pendingAmount)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <PDFRenderer pdfTemplate="MembershipInvoicePDF" data={pdfPayload}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="size-4" />
                            PDF
                          </Button>
                        </DialogTrigger>
                      </PDFRenderer>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredMemberships.length === 0 && (
            <div className="min-h-[220px] flex flex-col items-center justify-center gap-2 text-center px-4">
              <FileText className="size-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-800">No invoices match that search.</p>
              <p className="text-xs text-slate-500">Try a different client name, email, phone, or invoice number.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceInfoNotification({ missingFields, onUpdate }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleUpdate = () => {
    onUpdate?.();
  };

  const missingCount = missingFields.length;
  const missingText = missingCount === 1 
    ? missingFields[0]
    : missingCount === 2
    ? `${missingFields[0]} and ${missingFields[1]}`
    : `${missingFields.slice(0, -1).join(", ")}, and ${missingFields[missingFields.length - 1]}`;

  return (
    <div className="relative">
      <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                Invoice Information Incomplete
              </h4>
              <p className="text-sm text-amber-800 mb-3">
                {missingCount === 1 
                  ? `Please add your ${missingText.toLowerCase()} to generate invoices.`
                  : `Please add the following to generate invoices: ${missingText.toLowerCase()}.`
                }
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUpdate}
                  className="h-8 text-xs border-amber-300 hover:bg-amber-100"
                >
                  Update Now
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDismiss}
                  className="h-8 text-xs text-amber-700 hover:bg-amber-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
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

function SearchBar({ query, onChange, activeFields, onToggleField, paymentFilter, onPaymentFilterChange, invoiceType, onInvoiceTypeChange }) {
  const filterOptions = [
    { id: "clientName", label: "Client name" },
    { id: "email", label: "Email" },
    { id: "mobileNumber", label: "Phone" },
    { id: "invoice", label: "Invoice #" },
    { id: "city", label: "City" },
    { id: "description", label: "Description" },
  ];

  const toggleField = (id) => {
    onToggleField((prev) => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      return [...prev, id];
    });
  };

  const toggleInvoiceType = function (type, types) {
    if (types.includes(type)) return types.filter(item => type !== item)
    return [...types, type]
  }

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="relative flex-1 md:w-72">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={e => onChange(e.target.value)}
          className="pl-9"
          placeholder="Search by name, invoice, phone..."
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 space-y-2 grid grid-cols-2 gap-2 items-start">
          <div>
            <p className="text-xs text-slate-500">Search in fields</p>
            <div className="grid grid-cols-1 gap-2">
              {filterOptions.map((item) => {
                const checked = activeFields.includes(item.id);
                return (
                  <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleField(item.id)}
                      className="accent-[var(--accent-1)]"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Payment Type</p>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceType.length === 2}
                onChange={() => onInvoiceTypeChange(invoiceType.length === 2 ? [] : ["pending", "completed"])}
                className="accent-[var(--accent-1)]"
              />
              <span>All</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceType.includes("pending")}
                onChange={() => onInvoiceTypeChange(toggleInvoiceType("pending", invoiceType))}
                className="accent-[var(--accent-1)]"
              />
              <span>Pending</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceType.includes("completed")}
                onChange={() => onInvoiceTypeChange(toggleInvoiceType("completed", invoiceType))}
                className="accent-[var(--accent-1)]"
              />
              <span>Completed</span>
            </label>
          </div>
        </PopoverContent>
      </Popover>
      <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Payment mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All payment modes</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="upi">UPI</SelectItem>
          <SelectItem value="online">Online / Netbanking</SelectItem>
          <SelectItem value="card">Card</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function UpdateInvoiceMeta({ meta } = {}) {
  return
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

function createInvoiceStats(list = []) {
  let totalAmount = 0;
  let collectedAmount = 0;
  let thisMonth = 0;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  for (const item of list) {
    const amount = Number(item.amount);
    const paid = Number(item.paidAmount ?? item.amount);

    if (Number.isFinite(amount)) totalAmount += amount;
    if (Number.isFinite(paid)) collectedAmount += Math.min(paid, amount || paid);

    const start = item.startDate ? new Date(item.startDate) : null;
    if (start && start >= monthStart) thisMonth += 1;
  }

  const pendingAmount = Math.max(totalAmount - collectedAmount, 0);

  return { totalAmount, collectedAmount, pendingAmount, thisMonth };
}

function InvoiceHighlights({ stats, total }) {
  const items = [
    {
      label: "Total invoices",
      value: total,
      helper: "Across all clients"
    },
    {
      label: "Billed this month",
      value: stats.thisMonth,
      helper: "Invoices that started this month"
    },
    {
      label: "Collected",
      value: formatCurrency(stats.collectedAmount),
      helper: "Total paid"
    },
    {
      label: "Total amount",
      value: formatCurrency(stats.totalAmount),
      helper: "All-time billed"
    },
    {
      label: "Pending",
      value: formatCurrency(stats.pendingAmount),
      helper: "Outstanding balance"
    }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="py-4 shadow-none border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wide text-slate-500">{item.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold text-slate-900">{item.value ?? "-"}</CardTitle>
            <p className="text-xs text-slate-500">{item.helper}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function PaymentBadge({ mode }) {
  const value = (mode || "unknown").toString().toUpperCase();
  const isOnline = ["ONLINE", "UPI", "CARD", "NETBANKING"].includes(value);
  const variant = isOnline ? "wz" : "outline";
  return (
    <Badge variant={variant} className="text-xs px-2 py-1">
      {value}
    </Badge>
  );
}