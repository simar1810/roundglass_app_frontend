import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import UpdateCoachAwardModal from "@/components/modals/coach/UpdateCoachAwardModal";
import UpdateCoachSocialsModal from "@/components/modals/coach/UpdateCoachSocialsModal";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coachPortfolioSocialLinks } from "@/config/data/ui";
import state from "@/config/state-data/login";
import { sendData, sendDataWithFormData } from "@/lib/api";
import { getCoachSocialLinks } from "@/lib/fetchers/app";
import { useAppSelector } from "@/providers/global/hooks";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

export default function CoachData({ awards }) {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="links">
      <Header />
      <CoachSMLinks />
      <CoachAwards awards={awards} />
      <CoachClubSettings />
    </Tabs>
  </div>
}


function Header() {
  return <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-3 border-b-2 rounded-none">
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="links"
    >
      Links
    </TabsTrigger>
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="awards"
    >
      Awards
    </TabsTrigger>
    <TabsTrigger
      className="font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:border-0 data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)]"
      value="club"
    >
      Club
    </TabsTrigger>
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
          <Link target="_blank" href={socialLinks[social.name]}>{socialLinks[social.name]}</Link>
        </div>)}
    </div>
    <UpdateCoachSocialsModal socialLinks={socialLinks} />
  </TabsContent>
}

function CoachAwards({ awards }) {
  return <TabsContent value="awards">
    <div className="flex items-center gap-2 justify-between">
      <h4>{awards.length} Awards Available</h4>
      <UpdateCoachAwardModal />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
      {awards.map(award => <div key={award._id} className="flex items-center gap-4 relative">
        <Image
          src={award.image || "/illustrations/award.png"}
          onError={e => e.target.src = "/illustrations/award.png"}
          alt=""
          height={64}
          width={64}
          className="w-[56px] h-[56px] object-contain rounded-full border-2 border-[var(--accent-1)]"
        />
        <p className="mr-auto">{award.title}</p>
        <DeleteAward awardId={award._id} />
      </div>)}
    </div>
    {awards.length === 0 && <div className="h-[200px] flex items-center justify-center">
      <UpdateCoachAwardModal />
    </div>
    }
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