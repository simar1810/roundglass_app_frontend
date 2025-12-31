import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ImageSelector from "@/components/common/ImageSelector";
import Loader from "@/components/common/Loader";
import FormControl from "@/components/FormControl";
import UpdateCoachAwardModal from "@/components/modals/coach/UpdateCoachAwardModal";
import UpdateCoachSocialsModal from "@/components/modals/coach/UpdateCoachSocialsModal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coachPortfolioSocialLinks } from "@/config/data/ui";
import { fetchData, sendData, sendDataWithFormData } from "@/lib/api";
import { getCoachSocialLinks, retrieveBankDetails } from "@/lib/fetchers/app";
import { cn, getObjectUrl } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { Award, Dot, Image as ImageIcon, Landmark, Link as LucideLink, Pencil, ReceiptIndianRupee, Settings, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function CoachData({ awards }) {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="links">
      <Header />
      <CoachSMLinks />
      <CoachAwards awards={awards} />
      <CoachClubSettings />
      <BankDetails />
      <InvoiceDetails />
      <CoachToggleSettings />
    </Tabs>
  </div>
}
const tabItems = [
  { icon: <LucideLink className="w-[16px] h-[16px]" />, value: "links", label: "Links" },
  { icon: <Award className="w-[16px] h-[16px]" />, value: "awards", label: "Awards" },
  { icon: <Users className="w-[16px] h-[16px]" />, value: "club", label: "Club" },
  { icon: <Landmark className="w-[16px] h-[16px]" />, value: "bank", label: "Bank" },
  { icon: <ReceiptIndianRupee className="w-[16px] h-[16px]" />, value: "invoice", label: "Invoice" },
  { icon: <Settings className="w-[16px] h-[16px]" />, value: "settings", label: "Settings" },
];

function Header() {
  const { organisation } = useAppSelector(state => state.coach.data);
  return <TabsList className="w-full h-auto bg-transparent p-0 mb-10 flex items-start gap-x-2 gap-y-3 flex-wrap rounded-none no-scrollbar">
    {tabItems.map(({ icon, value, label, showIf }) => {
      if (showIf && !showIf(organisation)) return null;
      return (
        <TabsTrigger
          key={value}
          className="min-w-[100px] mb-[-5px] px-2 font-semibold flex-1 basis-0 flex items-center gap-1 rounded-[10px] py-2
             data-[state=active]:bg-[var(--accent-1)] data-[state=active]:text-[var(--comp-1)]
             data-[state=active]:shadow-none text-[#808080] bg-[var(--comp-1)] border-1 border-[#EFEFEF]"
          value={value}
        >
          {icon}
          {label}
        </TabsTrigger>
      );
    })}
  </TabsList>
}

function CoachSMLinks() {
  const { isLoading, error, data } = useSWR("getCoachSocialLinks", () => getCoachSocialLinks());

  if (isLoading) return <TabsContent value="links">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="links">
    <p className="text-center mt-4">{error || data.message} </p>
    <UpdateCoachSocialsModal socialLinks={{}} />
  </TabsContent>

  const socialLinks = data.data;

  return <TabsContent value="links">
    <div>
      {coachPortfolioSocialLinks.map(social =>
        socialLinks[social.name]
        && <div
          key={social.id}
          className="px-4 mb-2 flex items-center gap-4"
        >
          {social.icon}
          <Link target="_blank" href={socialLinks[social.name]} className="w-full md:text-xs lg:text-base break-all">{socialLinks[social.name]}</Link>
        </div>)}
    </div>
    <UpdateCoachSocialsModal socialLinks={socialLinks} />
  </TabsContent>
}

function CoachAwards({ awards }) {
  return <TabsContent value="awards">
    <div className="flex items-center gap-2 justify-between mb-4">
      <h4 className="text-lg font-semibold">{awards.length} {awards.length === 1 ? 'Award' : 'Awards'} Available</h4>
      <UpdateCoachAwardModal />
    </div>
    {awards.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {awards.map(award => <div key={award._id} className="flex items-center gap-4 p-3 border-1 rounded-[10px] hover:bg-muted/50 transition-colors relative">
          <Image
            src={award.image || "/illustrations/award.png"}
            onError={e => e.target.src = "/illustrations/award.png"}
            alt={award.title || "Award"}
            height={64}
            width={64}
            className="w-[56px] h-[56px] object-contain rounded-full border-2 border-[var(--accent-1)] flex-shrink-0"
          />
          <p className="mr-auto font-medium">{award.title}</p>
          <DeleteAward awardId={award._id} />
        </div>)}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-[10px]">
        <Award className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4 text-center">No awards added yet</p>
        <UpdateCoachAwardModal />
      </div>
    )}
  </TabsContent>
}

const clubFreeTrialSettings = [
  { id: 1, label: "Free Trial Days", name: "freeTrialVPDays" },
  { id: 2, label: "Roll Number Initials", name: "rollNumberInitials" },
]

const clubSubscriptionSettings = [
  { id: 1, label: "Free Trial Days", name: "freeTrialVPDays" },
  { id: 2, label: "Roll Number Initials", name: "rollNumberInitials" },
];

const clubVolumeSettings = [
  { id: 1, label: "Volume Point Deduction", name: "monthlyVpDeduction" },
  { id: 2, label: "No Of Free Trial Days", name: "freeTrialVPDays" },
  { id: 3, label: "Roll Number Initials", name: "rollNumberInitials" },
]


const ClubSettingsMap = new Map();
ClubSettingsMap.set(0, clubFreeTrialSettings);
ClubSettingsMap.set(1, clubSubscriptionSettings);
ClubSettingsMap.set(2, clubVolumeSettings);

function CoachClubSettings() {
  const [formData, setFormData] = useState({ file: undefined });
  const [loading, setLoading] = useState(false);

  const coach = useAppSelector(state => state.coach.data);
  const fields = ClubSettingsMap.get(coach.clubSystem);

  async function udpateDetails() {
    try {
      setLoading(true)
      const response = await sendData(`updateProfileDetails?id=${coach._id}`, formData, "PUT");
      if (!response.status) throw new Error(response.message);
      toast.success(response.message);
      mutate("coachProfile");
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    } finally {
      setLoading(false);
    }
  }

  return <TabsContent value="club">
    {fields.map(field => <FormControl
      key={field.id}
      defaultValue={coach[field.name] || ""}
      onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
      placeholder="Please enter value"
      className="block mb-4"
      {...field}
    />)}
    <Button
      className="block mt-10 mx-auto"
      variant="wz"
      onClick={udpateDetails}
      disabled={loading}
    >
      Save
    </Button>
  </TabsContent>
}

function DeleteAward({ awardId }) {
  async function deleteNote(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData("app/coach/delete-award", { awardId }, "DELETE");
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload()
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return <DualOptionActionModal
    description="You are deleting an award. Are you sure?"
    action={(setLoading, btnRef) => deleteNote(setLoading, btnRef)}
  >
    <AlertDialogTrigger>
      <X strokeWidth={3} className="w-[20px] h-[20px] text-white bg-[var(--accent-2)] p-[2px] rounded-[4px]" />
    </AlertDialogTrigger>
  </DualOptionActionModal>
}

function BankDetails() {
  const { isLoading, error, data } = useSWR("bank/details", () => retrieveBankDetails({ person: "coach" }));

  if (isLoading) return <TabsContent value="bank">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="bank">
    <ContentError title={error || data.message} />
  </TabsContent>
  const bank = data.data || {}
  const hasBankData = bank.accountNumber || bank.accountName || bank.bankName;
  
  return <TabsContent value="bank" className="space-y-4">
    {hasBankData ? (
      <Card className="bg-[var(--comp-1)] w-full mx-auto shadow-none rounded-2xl relative">
        <UpdateBankDetails bank={bank} />
        <CardHeader className="flex flex-col items-center gap-4 pb-4">
          {bank.qr && (
            <Image
              src={bank.qr}
              alt="QR Code"
              height={200}
              width={200}
              className="bg-white h-[200px] w-[200px] object-contain border-2 border-muted rounded-[16px]"
              onError={e => e.target.src = "/not-found.png"}
            />
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center pb-4 border-b">
            <CardTitle className="text-xl font-semibold mb-2">{bank.accountName || "—"}</CardTitle>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{bank.bankName || "—"}</span>
              {bank.bankName && bank.accountNumber && <Dot className="w-4 h-4" />}
              <span>{bank.accountNumber || "—"}</span>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-sm">Bank Branch</span>
              <span className="text-sm text-muted-foreground">{bank.bankBranch || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-sm">IFSC Code</span>
              <span className="text-sm text-muted-foreground font-mono">{bank.ifscCode || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-sm">Account Holder</span>
              <span className="text-sm text-muted-foreground">{bank.accountName || "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-[10px]">
        <Landmark className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4 text-center">No bank details added yet</p>
        <UpdateBankDetails bank={bank} />
      </div>
    )}
  </TabsContent>
}

function UpdateBankDetails({ bank }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState({
    accountNumber: bank?.accountNumber || "",
    accountName: bank?.accountName || "",
    bankName: bank?.bankName || "",
    bankBranch: bank?.bankBranch || "",
    ifscCode: bank?.ifscCode || "",
    file: null
  });

  const fileRef = useRef();
  const closeBtnRef = useRef();

  const resetForm = () => {
    setPayload({
      accountNumber: bank?.accountNumber || "",
      accountName: bank?.accountName || "",
      bankName: bank?.bankName || "",
      bankBranch: bank?.bankBranch || "",
      ifscCode: bank?.ifscCode || "",
      file: null
    });
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  async function saveBankDetails() {
    try {
      if (!payload.accountNumber.trim()) {
        toast.error("Please enter account number");
        return;
      }
      if (!payload.accountName.trim()) {
        toast.error("Please enter account name");
        return;
      }
      if (!payload.bankName.trim()) {
        toast.error("Please enter bank name");
        return;
      }
      if (!payload.ifscCode.trim()) {
        toast.error("Please enter IFSC code");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("accountNumber", payload.accountNumber);
      formData.append("accountName", payload.accountName);
      formData.append("bankName", payload.bankName);
      formData.append("bankBranch", payload.bankBranch || "");
      formData.append("ifscCode", payload.ifscCode);
      if (payload.file) {
        formData.append("file", payload.file);
      }
      
      const response = await sendDataWithFormData("app/bank", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Bank details saved successfully");
      mutate("bank/details");
      handleClose();
    } catch (error) {
      toast.error(error.message || "Failed to save bank details");
    } finally {
      setLoading(false);
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      {bank?.accountNumber ? (
        <Button variant="outline" size="sm" className="absolute top-4 right-4">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      ) : (
        <Button variant="wz" size="sm">
          <Landmark className="w-4 h-4 mr-2" />
          Add Bank Details
        </Button>
      )}
    </DialogTrigger>
    <DialogContent className="max-w-[600px] p-0 gap-0">
      <div className="p-6 border-b">
        <DialogTitle className="text-xl font-semibold">Bank Details</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">Enter your bank account information and upload QR code</p>
      </div>
      
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* QR Code Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="qr-code" className="text-sm font-medium">
            QR Code Image
          </Label>
          <div 
            onClick={() => fileRef.current?.click()} 
            className={cn(
              "h-[200px] flex flex-col items-center justify-center border-2 border-dashed rounded-[10px] cursor-pointer transition-colors relative overflow-hidden",
              (payload.file || bank?.qr) ? "border-primary" : "border-muted hover:border-primary/50"
            )}
          >
            <input
              type="file"
              id="qr-code"
              ref={fileRef}
              className="hidden"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  setPayload(prev => ({ ...prev, file }));
                }
              }}
            />
            {!payload.file && !bank?.qr ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload QR code</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
            ) : (
              <>
                <Image
                  src={payload.file ? getObjectUrl(payload.file) : bank?.qr || "/not-found.png"}
                  height={200}
                  width={200}
                  alt="QR Code"
                  className="object-contain p-4"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPayload(prev => ({ ...prev, file: null }));
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-sm font-medium">
              Account Holder Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="account-name"
              value={payload.accountName}
              onChange={e => setPayload(prev => ({ ...prev, accountName: e.target.value }))}
              placeholder="Enter account holder name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-number" className="text-sm font-medium">
              Account Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="account-number"
              value={payload.accountNumber}
              onChange={e => setPayload(prev => ({ ...prev, accountNumber: e.target.value }))}
              placeholder="Enter account number"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-name" className="text-sm font-medium">
              Bank Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bank-name"
              value={payload.bankName}
              onChange={e => setPayload(prev => ({ ...prev, bankName: e.target.value }))}
              placeholder="Enter bank name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-branch" className="text-sm font-medium">
              Bank Branch
            </Label>
            <Input
              id="bank-branch"
              value={payload.bankBranch}
              onChange={e => setPayload(prev => ({ ...prev, bankBranch: e.target.value }))}
              placeholder="Enter bank branch"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ifsc-code" className="text-sm font-medium">
              IFSC Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ifsc-code"
              value={payload.ifscCode}
              onChange={e => setPayload(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
              placeholder="Enter IFSC code"
              className="font-mono"
              maxLength={11}
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="wz"
            onClick={saveBankDetails}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Details"}
          </Button>
        </div>
      </div>
      <DialogClose ref={closeBtnRef} className="hidden" />
    </DialogContent>
  </Dialog>
}

function InvoiceDetails() {
  return <TabsContent value="invoice">
    <InvoiceDetailsContainer />
  </TabsContent>
}

function InvoiceDetailsContainer() {
  const { isLoading, error, data } = useSWR(
    "app/memberships-invoices/meta",
    () => fetchData("app/memberships-invoices/meta")
  );

  if (isLoading) return <Loader />

  if (error || data.status_code !== 200) return <ContentError title={error || data.message} />

  const invoiceMeta = data.data || {};
  const hasInvoiceData = invoiceMeta.title || invoiceMeta.gstin || invoiceMeta.address;

  return <TabsContent value="invoice" className="space-y-4">
    {hasInvoiceData ? (
      <Card className="bg-[var(--comp-1)] w-full mx-auto shadow-none rounded-2xl relative">
        <UpdateInvoiceDetails defaultData={data.data} />
        <CardHeader className="flex flex-col items-center gap-4 pb-4">
          {invoiceMeta.signature && (
            <Image
              src={invoiceMeta.signature}
              alt="Signature"
              height={200}
              width={200}
              className="bg-white h-[200px] w-[200px] object-contain border-2 border-muted rounded-[16px]"
              onError={e => e.target.src = "/not-found.png"}
            />
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center pb-4 border-b">
            <CardTitle className="text-xl font-semibold">{invoiceMeta.title || "—"}</CardTitle>
          </div>
          <div className="grid gap-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-sm">GSTIN</span>
              <span className="text-sm text-muted-foreground font-mono">{invoiceMeta.gstin || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-sm">GST Percentage</span>
              <span className="text-sm text-muted-foreground">{invoiceMeta.gst || "0.0"}%</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b">
              <span className="font-medium text-sm">Address</span>
              <span className="text-sm text-muted-foreground text-right max-w-[60%]">{invoiceMeta.address || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-sm">Place Of Supply</span>
              <span className="text-sm text-muted-foreground">{invoiceMeta.placeOfSupply || "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-[10px]">
        <ReceiptIndianRupee className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4 text-center">No invoice details added yet</p>
        <UpdateInvoiceDetails defaultData={data.data} />
      </div>
    )}
  </TabsContent>
}


const invoiceFields = [
  { name: "title", label: "Company Name" },
  { name: "address", label: "Address" },
  { name: "gstin", label: "GSTIN" },
  { name: "gst", label: "GST Percentage" },
  { name: "placeOfSupply", label: "Place of Supply" },
  // { name: "bankName", label: "Bank Name" },
  // { name: "accountNumber", label: "Account Number" },
  // { name: "ifscCode", label: "IFSC Code" },
  // { name: "branch", label: "Branch" }
];

const createDefaultPayload = (data) => invoiceFields.reduce((acc, curr) => {
  const value = data[curr.name];
  // For GST, preserve numeric values including 0, only use empty string if truly missing
  if (curr.name === "gst") {
    acc[curr.name] = value !== null && value !== undefined && value !== "" ? String(value) : "";
  } else {
    acc[curr.name] = value || "";
  }
  return acc;
}, {})

function UpdateInvoiceDetails({ defaultData }) {
  const [payload, setPayload] = useState(createDefaultPayload(defaultData || {}));
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState(null);
  const [open, setOpen] = useState(false);

  const resetForm = () => {
    setPayload(createDefaultPayload(defaultData || {}));
    setSignature(null);
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  async function updateInvoiceMeta() {
    try {
      if (!payload.title?.trim()) {
        toast.error("Please enter company name");
        return;
      }
      if (!payload.gstin?.trim()) {
        toast.error("Please enter GSTIN");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      for (const field of invoiceFields) {
        // For GST, allow 0 as a valid value, only use empty string if truly empty
        const value = payload[field.name];
        if (field.name === "gst") {
          formData.append(field.name, value !== null && value !== undefined && value !== "" ? value : "");
        } else {
          formData.append(field.name, value || "");
        }
      }
      if (signature) {
        formData.append("signature", signature);
      }
      const response = await sendDataWithFormData("app/memberships-invoices/meta", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message || "Invoice details saved successfully");
      mutate("app/memberships-invoices/meta");
      handleClose();
    } catch (error) {
      toast.error(error.message || "Failed to save invoice details");
    } finally {
      setLoading(false);
    }
  }

  const hasData = defaultData?.title || defaultData?.gstin;

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      {hasData ? (
        <Button variant="outline" size="sm" className="absolute top-4 right-4">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      ) : (
        <Button variant="wz" size="sm">
          <ReceiptIndianRupee className="w-4 h-4 mr-2" />
          Add Invoice Details
        </Button>
      )}
    </DialogTrigger>
    <DialogContent className="max-w-[600px] p-0 gap-0">
      <div className="p-6 border-b">
        <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1">Enter your company information for invoice generation</p>
      </div>
      
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Signature Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Signature</Label>
          <ImageSelector
            file={signature}
            onFileChange={setSignature}
            label="Upload Signature"
            defaultImageLink={defaultData?.signature}
          />
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company-name" className="text-sm font-medium">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              value={payload.title}
              onChange={e => setPayload(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter company name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstin" className="text-sm font-medium">
              GSTIN <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gstin"
              value={payload.gstin}
              onChange={e => setPayload(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
              placeholder="Enter GSTIN"
              className="font-mono"
              maxLength={15}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gst" className="text-sm font-medium">
              GST Percentage
            </Label>
            <Input
              id="gst"
              type="number"
              value={payload.gst}
              onChange={e => setPayload(prev => ({ ...prev, gst: e.target.value }))}
              placeholder="0.0"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="address"
              value={payload.address}
              onChange={e => setPayload(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter company address"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="place-of-supply" className="text-sm font-medium">
              Place Of Supply
            </Label>
            <Input
              id="place-of-supply"
              value={payload.placeOfSupply}
              onChange={e => setPayload(prev => ({ ...prev, placeOfSupply: e.target.value }))}
              placeholder="Enter place of supply"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="wz"
            onClick={updateInvoiceMeta}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Saving..." : "Save Details"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
}

function CoachToggleSettings() {
  const coach = useAppSelector(state => state.coach.data);
  const [onboardingMode, setOnboardingMode] = useState(coach?.onboardingMode || false);
  const [membershipCoreMode, setMembershipCoreMode] = useState(coach?.membershipCoreMode || false);
  const [loading, setLoading] = useState(false);

  // Update local state when coach data changes
  useEffect(() => {
    if (coach) {
      setOnboardingMode(coach.onboardingMode || false);
      setMembershipCoreMode(coach.membershipCoreMode || false);
    }
  }, [coach]);

  async function updateToggle(toggleName, value) {
    try {
      setLoading(true);
      const payload = {
        onboardingMode: toggleName === "onboardingMode" ? value : onboardingMode,
        membershipCoreMode: toggleName === "membershipCoreMode" ? value : membershipCoreMode,
      };
      
      const response = await sendData("app/update-coach-toggle-field", payload, "PUT");
      
      // Handle 401 unauthorized (sendData returns null on 401)
      if (!response) {
        throw new Error("Unauthorized. Please log in again.");
      }
      
      // Handle error responses
      if (response.status_code !== 200 && response.status !== true) {
        throw new Error(response.message || "Failed to update toggle");
      }
      
      toast.success(response.message || "Toggle updated successfully");
      
      // Update local state
      if (toggleName === "onboardingMode") {
        setOnboardingMode(value);
      } else {
        setMembershipCoreMode(value);
      }
      
      // Refresh coach profile
      mutate("coachProfile");
    } catch (error) {
      toast.error(error.message || "Please try again later!");
      // Revert the toggle on error
      if (toggleName === "onboardingMode") {
        setOnboardingMode(!value);
      } else {
        setMembershipCoreMode(!value);
      }
    } finally {
      setLoading(false);
    }
  }

  return <TabsContent value="settings" className="space-y-6">
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border-1 rounded-[10px]">
        <div className="flex-1">
          <h4 className="font-semibold text-base mb-1">Onboarding Mode</h4>
          <p className="text-sm text-muted-foreground">
            Makes the sign up questionnaire more informative for the client
          </p>
        </div>
        <Switch
          checked={onboardingMode}
          onCheckedChange={(checked) => updateToggle("onboardingMode", checked)}
          disabled={loading}
        />
      </div>
      
      <div className="flex items-center justify-between p-4 border-1 rounded-[10px]">
        <div className="flex-1">
          <h4 className="font-semibold text-base mb-1">Coach Core Membership Mode</h4>
          <p className="text-sm text-muted-foreground">
            Allows the coach to inactive the client after its club membership has ended
          </p>
        </div>
        <Switch
          checked={membershipCoreMode}
          onCheckedChange={(checked) => updateToggle("membershipCoreMode", checked)}
          disabled={loading}
        />
      </div>
    </div>
  </TabsContent>
}