import { UploadReport } from "@/app/(authorized)/coach/reports/page";
import ContentError from "@/components/common/ContentError"
import ContentLoader from "@/components/common/ContentLoader"
import { TabsContent } from "@/components/ui/tabs"
import { retrieveReports } from "@/lib/fetchers/app";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";

export default function ClientReports() {
  const { id } = useParams()
  const { isLoading, data, error } = useSWR(`reports/client/${id}`, () => retrieveReports("coach", id));

  if (isLoading) return <TabsContent value="client-reports">
    <ContentLoader />
  </TabsContent>

  if (error || data.status_code !== 200) return <TabsContent value="client-reports">
    <ContentError title={error?.message || data?.message} className="mt-0" />
  </TabsContent>

  const [report] = data?.data || []
  if (!report) return <TabsContent value="client-reports" className="text-center">
    <p className="mb-4">No report uploaded</p>
    <UploadReport clientId={id} />
  </TabsContent>

  return <TabsContent
    value="client-reports"
  >
    {report.reports.length === 0 && <div>No reports found</div>}
    <div className="grid grid-cols-2 gap-4">
      {report?.reports?.map((report, index) => report.file_type === "image"
        ? <div key={index} className="min-h-96">
          <Image
            src={report.file}
            alt=""
            height={1024}
            width={1024}
            className="rounded-[10px] max-h-80 object-cover h-full"
            onError={e => e.target.src = "/not-found.png"}
          />
          <div className="py-2">
            <h2>{report.title}</h2>
            <p>{report.description}</p>
          </div>
        </div>
        : <div key={index} className="min-h-96">
          <iframe
            src={report.file}
            title="PDF preview"
            className="w-full border rounded-lg max-h-80 h-full"
          />
          <div className="py-2">
            <h2>{report.title}</h2>
            <p>{report.description}</p>
          </div>
        </div>)}
    </div>
  </TabsContent>
}