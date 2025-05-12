import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return <div className="content-container">
    <h4>Subscription</h4>
    <Tabs defaultValue="active">
      <TabsList className="w-full h-auto bg-transparent p-0 my-4 flex justify-start border-y-2 rounded-none">
        <TabsTrigger
          className="max-w-[18ch] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)] py-[10px]"
          value="active"
        >
          Active
        </TabsTrigger>
        <TabsTrigger
          className="max-w-[18ch] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)] py-[10px]"
          value="add-on"
        >
          Add-Ons
        </TabsTrigger>
        <TabsTrigger
          className="max-w-[18ch] font-semibold rounded-none data-[state=active]:bg-transparent data-[state=active]:text-[var(--accent-1)] data-[state=active]:shadow-none data-[state=active]:!border-b-2 data-[state=active]:border-b-[var(--accent-1)] py-[10px]"
          value="inactive"
        >
          Inactive
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => i).map(item => <SubscriptionCard key={item} />)}
        </div>
      </TabsContent>
    </Tabs>
  </div>
}

function SubscriptionCard() {
  return <Card className="text-white bg-linear-to-r from-[var(--accent-1)] to-[#2F5613] gap-3">
    <CardHeader className="flex items-center gap-2 justify-between">
      <CardTitle className="text-[18px]">Subscripton Name</CardTitle>
      <Badge variant="wz">Active</Badge>
    </CardHeader>
    <CardContent className="text-[14px] leading-[1.2]">
      <ul>
        <li>Subscription ID: Pro</li>
        <li>valid From: 01/11/2025 Valid Till: 01/01/2025</li>
        <li>Transaction ID: Admin</li>
      </ul>
    </CardContent>
  </Card>
}