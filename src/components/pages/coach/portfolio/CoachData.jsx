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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coachPortfolioSocialLinks } from "@/config/data/ui";
import { fetchData, sendData, sendDataWithFormData } from "@/lib/api";
import { getCoachSocialLinks, retrieveBankDetails } from "@/lib/fetchers/app";
import { getObjectUrl } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import {
  Award,
  Dot,
  Landmark,
  Link as LucideLink,
  Pencil,
  ReceiptIndianRupee,
  Settings,
  Users,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import UpdateCoachSecrets from "./UpdateCoachSecrets";

export default function CoachData({ awards }) {
  return (
    <div className="bg-white p-4 rounded-[18px] border-1">
      <Tabs defaultValue="links">
        <Header />
        <CoachSMLinks />
        <CoachAwards awards={awards} />
        <CoachClubSettings />
        <BankDetails />
        <InvoiceDetails />
        <SettingsTab />
      </Tabs>
    </div>
  );
}
const tabItems = [
  {
    icon: <LucideLink className="w-[16px] h-[16px]" />,
    value: "links",
    label: "Links",
  },
  {
    icon: <Award className="w-[16px] h-[16px]" />,
    value: "awards",
    label: "Awards",
  },
  {
    icon: <Users className="w-[16px] h-[16px]" />,
    value: "club",
    label: "Club",
  },
  {
    icon: <Landmark className="w-[16px] h-[16px]" />,
    value: "bank",
    label: "Bank",
  },
  {
    icon: <ReceiptIndianRupee className="w-[16px] h-[16px]" />,
    value: "invoice",
    label: "Invoice",
  },
  {
    icon: <Settings className="w-[16px] h-[16px]" />,
    value: "settings",
    label: "Settings",
  },
];

function Header() {
  const { organisation } = useAppSelector((state) => state.coach.data);
  return (
    <TabsList className="w-full h-auto bg-transparent p-0 mb-10 flex items-start gap-x-2 gap-y-3 flex-wrap rounded-none no-scrollbar">
      {tabItems.map(({ icon, value, label, showIf }) => {
        if (showIf && !showIf(organisation)) return null;
        return (
          <TabsTrigger
            key={value}
            className="min-w-[140px] mb-[-5px] px-2 font-semibold flex-1 basis-0 flex items-center gap-1 rounded-[10px] py-2
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
  );
}

function CoachSMLinks() {
  const { isLoading, error, data } = useSWR("getCoachSocialLinks", () =>
    getCoachSocialLinks(),
  );

  if (isLoading)
    return (
      <TabsContent value="links">
        <ContentLoader />
      </TabsContent>
    );

  if (error || data.status_code !== 200)
    return (
      <TabsContent value="links">
        <div className="text-center py-12 border-1 border-dashed rounded-2xl bg-[var(--comp-1)]">
          <LucideLink className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{error || data.message}</p>
          <UpdateCoachSocialsModal socialLinks={{}} />
        </div>
      </TabsContent>
    );

  const socialLinks = data.data;
  const activeLinks = coachPortfolioSocialLinks.filter(
    (social) => socialLinks[social.name]
  );

  return (
    <TabsContent value="links" className="space-y-4">
      {activeLinks.length > 0 ? (
        <Card className="bg-[var(--comp-1)] w-full shadow-none rounded-2xl border-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Social Media Links</CardTitle>
              <UpdateCoachSocialsModal socialLinks={socialLinks} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeLinks.map((social) => (
              <div
                key={social.id}
                className="flex items-center gap-4 p-3 rounded-lg border-1 bg-white hover:bg-[var(--comp-1)] transition-colors"
              >
                <div className="flex-shrink-0 text-[var(--accent-1)]">
                  {social.icon}
                </div>
                <Link
                  target="_blank"
                  href={socialLinks[social.name]}
                  className="flex-1 text-sm md:text-base break-all hover:text-[var(--accent-1)] transition-colors"
                >
                  {socialLinks[social.name]}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 border-1 border-dashed rounded-2xl bg-[var(--comp-1)]">
          <LucideLink className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No social media links added yet</p>
          <UpdateCoachSocialsModal socialLinks={socialLinks} />
        </div>
      )}
    </TabsContent>
  );
}

function CoachAwards({ awards }) {
  return (
    <TabsContent value="awards" className="space-y-6">
      {awards.length > 0 ? (
        <Card className="bg-[var(--comp-1)] w-full shadow-none rounded-2xl border-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Awards</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {awards.length} {awards.length === 1 ? "award" : "awards"} available
                </p>
              </div>
              <UpdateCoachAwardModal />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awards.map((award) => (
                <div
                  key={award._id}
                  className="flex items-center gap-4 p-3 rounded-lg border-1 bg-white hover:bg-[var(--comp-1)] transition-colors relative"
                >
                  <Image
                    src={award.image || "/illustrations/award.png"}
                    onError={(e) => (e.target.src = "/illustrations/award.png")}
                    alt={award.title}
                    height={64}
                    width={64}
                    className="w-[56px] h-[56px] object-contain rounded-full border-2 border-[var(--accent-1)] flex-shrink-0"
                  />
                  <p className="flex-1 font-medium">{award.title}</p>
                  <DeleteAward awardId={award._id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 border-1 border-dashed rounded-2xl bg-[var(--comp-1)]">
          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No awards added yet</p>
          <UpdateCoachAwardModal />
        </div>
      )}
    </TabsContent>
  );
}

const clubFreeTrialSettings = [
  { id: 1, label: "Free Trial Days", name: "freeTrialVPDays" },
  { id: 2, label: "Roll Number Initials", name: "rollNumberInitials" },
];

const clubSubscriptionSettings = [
  { id: 1, label: "Free Trial Days", name: "freeTrialVPDays" },
  { id: 2, label: "Roll Number Initials", name: "rollNumberInitials" },
];

const clubVolumeSettings = [
  { id: 1, label: "Volume Point Deduction", name: "monthlyVpDeduction" },
  { id: 2, label: "No Of Free Trial Days", name: "freeTrialVPDays" },
  { id: 3, label: "Roll Number Initials", name: "rollNumberInitials" },
];

const ClubSettingsMap = new Map();
ClubSettingsMap.set(0, clubFreeTrialSettings);
ClubSettingsMap.set(1, clubSubscriptionSettings);
ClubSettingsMap.set(2, clubVolumeSettings);

function CoachClubSettings() {
  const [formData, setFormData] = useState({ file: undefined });
  const [loading, setLoading] = useState(false);

  const coach = useAppSelector((state) => state.coach.data);
  const fields = ClubSettingsMap.get(coach.clubSystem);

  async function updateDetails() {
    try {
      setLoading(true);
      const response = await sendData(
        `updateProfileDetails?id=${coach._id}`,
        formData,
        "PUT",
      );
      if (!response.status) throw new Error(response.message);
      toast.success(response.message);
      mutate("coachProfile");
    } catch (error) {
      toast.error(error.message || "Please try again later!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <TabsContent value="club" className="space-y-6">
      <Card className="bg-[var(--comp-1)] w-full shadow-none rounded-2xl border-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Club Settings</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your club membership settings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <FormControl
              key={field.id}
              defaultValue={(!coach[field.name] || !isNaN(coach[field.name])) ? coach[field.name] : ""}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="block"
              {...field}
            />
          ))}
          <div className="flex gap-3 pt-4 border-t-1">
            <Button
              variant="wz"
              onClick={updateDetails}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function DeleteAward({ awardId }) {
  async function deleteNote(setLoading, closeBtnRef) {
    try {
      setLoading(true);
      const response = await sendData(
        "app/coach/delete-award",
        { awardId },
        "DELETE",
      );
      if (response.status_code !== 200) throw new Error(response.message);
      toast.success(response.message);
      location.reload();
      closeBtnRef.current.click();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <DualOptionActionModal
      description="You are deleting an award. Are you sure?"
      action={(setLoading, btnRef) => deleteNote(setLoading, btnRef)}
    >
      <AlertDialogTrigger>
        <X
          strokeWidth={3}
          className="w-[20px] h-[20px] text-white bg-[var(--accent-2)] p-[2px] rounded-[4px]"
        />
      </AlertDialogTrigger>
    </DualOptionActionModal>
  );
}

function BankDetails() {
  const { isLoading, error, data } = useSWR("bank/details", () =>
    retrieveBankDetails({ person: "coach" }),
  );

  if (isLoading)
    return (
      <TabsContent value="bank">
        <ContentLoader />
      </TabsContent>
    );

  if (error || data.status_code !== 200)
    return (
      <TabsContent value="bank">
        <ContentError title={error || data.message} />
      </TabsContent>
    );
  const bank = data.data || {};
  const hasBankData = bank.accountNumber || bank.accountName;

  return (
    <TabsContent value="bank" className="space-y-6">
      {hasBankData ? (
        <Card className="bg-[var(--comp-1)] w-full mx-auto shadow-none rounded-2xl relative border-1">
          <UpdateBankDetails bank={bank} />
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center gap-4">
              {bank.qr && (
                <Image
                  src={bank.qr}
                  alt="QR Code"
                  height={200}
                  width={200}
                  className="bg-white h-[200px] w-[200px] object-contain border-1 rounded-[16px] shadow-sm"
                  onError={(e) => (e.target.src = "/not-found.png")}
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            <div className="text-center border-b-1 pb-4">
              <CardTitle className="text-xl font-bold mb-2">
                {bank.accountName || "N/A"}
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{bank.bankName || "N/A"}</span>
                {bank.bankName && bank.accountNumber && <Dot className="w-4 h-4" />}
                <span>{bank.accountNumber || ""}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bank Branch</span>
                <p className="text-sm font-medium">{bank.bankBranch || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">IFSC Code</span>
                <p className="text-sm font-medium font-mono">{bank.ifscCode || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 border-1 border-dashed rounded-2xl bg-[var(--comp-1)]">
          <Landmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No bank details added yet</p>
          <UpdateBankDetails bank={{}} />
        </div>
      )}
    </TabsContent>
  );
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
    file: null,
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
      for (const field in payload) {
        if (field === "file" && payload[field]) {
          formData.append(field, payload[field]);
        } else if (field !== "file" && payload[field]) {
          formData.append(field, payload[field]);
        }
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {bank?.accountNumber ? (
          <Button variant="outline" size="sm" className="absolute top-4 right-4 gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        ) : (
          <Button variant="wz" className="mx-auto">
            <Landmark className="w-4 h-4 mr-2" />
            Add Bank Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 bg-white z-10 border-b-1 px-6 py-4">
          <DialogTitle className="text-xl font-semibold">Bank Details</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Update your bank account information</p>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">QR Code / UPI ID Image</label>
            <div className="relative group">
              <div
                className="border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-[var(--accent-1)] transition-colors bg-[var(--comp-1)]"
                onClick={() => fileRef.current?.click()}
              >
                {payload.file || bank?.qr ? (
                  <div className="relative">
                    <Image
                      src={
                        payload.file
                          ? getObjectUrl(payload.file)
                          : bank.qr || "/not-found.png"
                      }
                      height={300}
                      width={300}
                      className="w-full max-h-[300px] object-contain rounded-lg mx-auto"
                      alt="QR Code Preview"
                      onError={(e) => (e.target.src = "/not-found.png")}
                    />
                    {payload.file && (
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayload((prev) => ({ ...prev, file: null }));
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Landmark className="w-12 h-12 mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Click to upload QR Code</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setPayload((prev) => ({ ...prev, file: e.target.files[0] || null }))
                }
              />
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <div className="border-t-1 pt-4">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl
                  value={payload.accountNumber}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  placeholder="Enter account number"
                  label="Account Number"
                  required
                  className="block"
                />
                <FormControl
                  value={payload.accountName}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, accountName: e.target.value }))
                  }
                  placeholder="Enter account holder name"
                  label="Account Holder Name"
                  required
                  className="block"
                />
              </div>
            </div>

            {/* Bank Information Section */}
            <div className="border-t-1 pt-4">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Bank Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl
                  value={payload.bankName}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  placeholder="Enter bank name"
                  label="Bank Name"
                  required
                  className="block"
                />
                <FormControl
                  value={payload.bankBranch}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, bankBranch: e.target.value }))
                  }
                  placeholder="Enter bank branch"
                  label="Bank Branch"
                  className="block"
                />
                <FormControl
                  value={payload.ifscCode}
                  onChange={(e) =>
                    setPayload((prev) => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))
                  }
                  placeholder="Enter IFSC code"
                  label="IFSC Code"
                  required
                  maxLength={11}
                  className="block md:col-span-2"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-1">
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
              onClick={saveBankDetails}
              disabled={loading}
              variant="wz"
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </div>
        <DialogClose ref={closeBtnRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetails() {
  return <InvoiceDetailsContainer />;
}

function InvoiceDetailsContainer() {
  const { isLoading, error, data } = useSWR(
    "app/memberships-invoices/meta",
    () => fetchData("app/memberships-invoices/meta"),
  );

  if (isLoading) return (
    <TabsContent value="invoice">
      <Loader />
    </TabsContent>
  );

  if (error || data.status_code !== 200)
    return (
      <TabsContent value="invoice">
        <ContentError title={error || data.message} />
      </TabsContent>
    );

  const invoiceMeta = data.data || {};
  const hasInvoiceData = invoiceMeta.title || invoiceMeta.gstin;

  return (
    <TabsContent value="invoice" className="space-y-6">
      {hasInvoiceData ? (
        <Card className="bg-[var(--comp-1)] w-full mx-auto shadow-none rounded-2xl relative border-1">
          <UpdateInvoiceDetails defaultData={invoiceMeta} />
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center gap-4">
              {invoiceMeta.signature && (
                <Image
                  src={invoiceMeta.signature}
                  alt="Signature"
                  height={200}
                  width={200}
                  className="bg-white h-[200px] w-[200px] object-contain border-1 rounded-[16px] shadow-sm"
                  onError={(e) => (e.target.src = "/not-found.png")}
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            <div className="text-center border-b-1 pb-4">
              <CardTitle className="text-xl font-bold mb-2">
                {invoiceMeta.title || "N/A"}
              </CardTitle>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GSTIN</span>
                <p className="text-sm font-medium font-mono">{invoiceMeta.gstin || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">GST Percentage</span>
                <p className="text-sm font-medium">{invoiceMeta.gst || "0.0"}%</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address</span>
                <p className="text-sm font-medium">{invoiceMeta.address || "N/A"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Place Of Supply</span>
                <p className="text-sm font-medium">{invoiceMeta.placeOfSupply || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 border-1 border-dashed rounded-2xl bg-[var(--comp-1)]">
          <ReceiptIndianRupee className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No invoice details added yet</p>
          <UpdateInvoiceDetails defaultData={{}} />
        </div>
      )}
    </TabsContent>
  );
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

const createDefaultPayload = (data) =>
  invoiceFields.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.name]: data[curr.name] || "",
    }),
    {},
  );

function UpdateInvoiceDetails({ defaultData }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(createDefaultPayload(defaultData || {}));
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState();

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
      if (payload.gst && (isNaN(payload.gst) || parseFloat(payload.gst) < 0 || parseFloat(payload.gst) > 100)) {
        toast.error("GST percentage must be between 0 and 100");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      for (const field of invoiceFields) {
        const value = payload[field.name];
        if (field.name === "gst") {
          formData.append(field.name, value !== null && value !== undefined && value !== "" ? value : "0");
        } else {
          formData.append(field.name, value || "");
        }
      }
      if (signature) {
        formData.append("signature", signature);
      }
      const response = await sendDataWithFormData(
        "app/memberships-invoices/meta",
        formData,
      );
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

  const hasInvoiceData = defaultData?.title || defaultData?.gstin;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {hasInvoiceData ? (
          <Button variant="outline" size="sm" className="absolute top-4 right-4 gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        ) : (
          <Button variant="wz" className="mx-auto">
            <ReceiptIndianRupee className="w-4 h-4 mr-2" />
            Add Invoice Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="sticky top-0 bg-white z-10 border-b-1 px-6 py-4">
          <DialogTitle className="text-xl font-semibold">Invoice Details</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Update your invoice and tax information</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormControl
                value={payload.title}
                onChange={(e) =>
                  setPayload((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter company/business name"
                label="Company Name"
                required
                className="block"
              />
              <FormControl
                value={payload.address}
                onChange={(e) =>
                  setPayload((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter business address"
                label="Address"
                className="block"
              />
            </div>
          </div>

          {/* Tax Information Section */}
          <div className="space-y-4 border-t-1 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tax Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl
                value={payload.gstin}
                onChange={(e) =>
                  setPayload((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))
                }
                placeholder="Enter GSTIN (15 characters)"
                label="GSTIN"
                required
                maxLength={15}
                className="block"
              />
              <FormControl
                type="number"
                value={payload.gst}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (!isNaN(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                    setPayload((prev) => ({ ...prev, gst: value }));
                  }
                }}
                placeholder="0.0"
                label="GST Percentage"
                min="0"
                max="100"
                step="0.01"
                className="block"
              />
              <FormControl
                value={payload.placeOfSupply}
                onChange={(e) =>
                  setPayload((prev) => ({ ...prev, placeOfSupply: e.target.value }))
                }
                placeholder="Enter place of supply"
                label="Place Of Supply"
                className="block md:col-span-2"
              />
            </div>
          </div>

          {/* Signature Upload Section */}
          <div className="space-y-3 border-t-1 pt-4">
            <ImageSelector
              file={signature}
              onFileChange={setSignature}
              label="Digital Signature"
              defaultImageLink={defaultData?.signature}
            />
            <p className="text-xs text-muted-foreground">
              Upload your digital signature that will appear on invoices
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-1">
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
              onClick={updateInvoiceMeta}
              disabled={loading}
              variant="wz"
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Invoice Details"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettingsTab() {
  return (
    <TabsContent value="settings">
      <SettingsTabContainer />
    </TabsContent>
  );
}

function SettingsTabContainer() {
  const { isLoading, error, data, mutate } = useSWR("coach/secrets", () =>
    fetchData("app/secrets?service=razorpay"),
  );

  if (isLoading)
    return (
      <div className="min-h-[200px] flex items-center justify-center border-1 bg-[var(--comp-1)] rounded-2xl">
        <Loader />
      </div>
    );

  const razorpay = data.data;
  if (error || data.status_code !== 200)
    return <ContentError title={error || data.message} />;
  return (
    <div className="space-y-6">
      <Card className="bg-[var(--comp-1)] w-full shadow-none rounded-2xl border-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Payment Gateway</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Razorpay integration credentials
              </p>
            </div>
            <UpdateCoachSecrets initialData={razorpay} onRefresh={mutate} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client ID</span>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white border-1">
              <p className="text-sm font-mono text-muted-foreground select-all break-all flex-1">
                {razorpay.razorpayClientId || "Not configured"}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Secret Key</span>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white border-1">
              <p className="text-sm font-mono text-muted-foreground select-all break-all flex-1">
                {razorpay.razorpaySecret ? "•".repeat(20) + razorpay.razorpaySecret.slice(-4) : "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <RaghavComponent />
    </div>
  );
}

function RaghavComponent() {
  const coach = useAppSelector(state => state.coach.data);
  const [onboardingMode, setOnboardingMode] = useState(coach?.onboardingMode || false);
  const [membershipCoreMode, setMembershipCoreMode] = useState(coach?.membershipCoreMode || false);
  const [loading, setLoading] = useState(false);

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

      if (!response) {
        throw new Error("Unauthorized. Please log in again.");
      }

      if (response.status_code !== 200 && response.status !== true) {
        throw new Error(response.message || "Failed to update toggle");
      }

      toast.success(response.message || "Toggle updated successfully");

      if (toggleName === "onboardingMode") {
        setOnboardingMode(value);
      } else {
        setMembershipCoreMode(value);
      }

      mutate("coachProfile");
    } catch (error) {
      toast.error(error.message || "Please try again later!");
      if (toggleName === "onboardingMode") {
        setOnboardingMode(!value);
      } else {
        setMembershipCoreMode(!value);
      }
    } finally {
      setLoading(false);
    }
  }
  return <div className="space-y-4">
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
}