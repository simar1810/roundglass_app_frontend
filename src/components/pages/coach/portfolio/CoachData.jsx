import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import UpdateCoachAwardModal from "@/components/modals/coach/UpdateCoachAwardModal";
import UpdateCoachSocialsModal from "@/components/modals/coach/UpdateCoachSocialsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { coachPortfolioSocialLinks } from "@/config/data/ui";
import { getCoachSocialLinks } from "@/lib/fetchers/app";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

export default function CoachData({ awards }) {
  return <div className="bg-white p-4 rounded-[18px] border-1">
    <Tabs defaultValue="links">
      <TabsList className="w-full bg-transparent p-0 mb-4 grid grid-cols-2 border-b-2 rounded-none">
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
      </TabsList>
      <CoachSMLinks />
      <CoachAwards awards={awards} />
    </Tabs>
  </div>
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
      <h4>4 Awards Available</h4>
      <UpdateCoachAwardModal />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
      {awards.map(award => <div key={award._id} className="flex items-center gap-4">
        <Image
          src={award.image || "/illustrations/award.png"}
          alt=""
          height={64}
          width={64}
          className="w-[64px] h-[64px] object-contain rounded-full border-2 border-[var(--accent-1)]"
        />
        <p>{award.title}</p>
      </div>)}
    </div>
  </TabsContent>
}