import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import { TabsContent } from "@/components/ui/tabs";

export default function PhysicalClub() {

  if (isLoading) return <TabsContent value="marathon">
    <ContentLoader />
  </TabsContent>

  if (error || !Boolean(data) || data?.status_code !== 200) return <TabsContent value="retail">
    <ContentError className="mt-0" title={error || data?.message} />
  </TabsContent>
  const marathons = data.data;

  return <TabsContent value="physical-club">

  </TabsContent>
}