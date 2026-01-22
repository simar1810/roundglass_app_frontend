"use client";

import CreateGroupModal from "@/components/modals/growth/CreateGroupModal";
import AddClientsToGroupModal from "@/components/modals/growth/AddClientsToGroupModal";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import FormControl from "@/components/FormControl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllGroups } from "@/lib/fetchers/growth";
import { format, parseISO } from "date-fns";
import { Eye, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { isLoading, error, data } = useSWR("api/growth/groups", () => getAllGroups());

  if (isLoading) return <ContentLoader />;

  if (error || data?.status_code !== 200) {
    // Handle 404 specifically - endpoint might not be implemented yet
    if (data?.status_code === 404 || error?.status === 404) {
      return (
        <div className="content-container space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Groups Endpoint Not Available</h3>
              <p className="text-muted-foreground mb-4">
                The backend endpoint for listing all groups is not yet implemented.
              </p>
              <p className="text-sm text-muted-foreground">
                You can still create groups and manage them from the Growth Dashboard.
              </p>
              <div className="mt-6">
                <Link href="/coach/growth/dashboard">
                  <Button variant="wz">Go to Growth Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    const { getGrowthErrorMessage } = require("@/lib/utils/growthErrors");
    const errorMessage = getGrowthErrorMessage(
      data?.status_code || 500,
      error || data?.message || "Failed to load groups",
      data
    );
    return (
      <div className="content-container">
        <ContentError title={errorMessage} />
      </div>
    );
  }

  const groups = useMemo(() => {
    if (!data?.data) return [];
    const groupsList = Array.isArray(data.data) ? data.data : [];
    if (!searchQuery.trim()) return groupsList;
    const query = searchQuery.toLowerCase();
    return groupsList.filter(
      (group) =>
        group.name?.toLowerCase().includes(query) ||
        group.description?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleViewReport = (groupId) => {
    router.push(`/coach/growth/dashboard?group=${groupId}`);
  };

  const handleGroupClick = (groupId) => {
    router.push(`/coach/growth/dashboard?group=${groupId}`);
  };

  return (
    <div className="content-container space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Growth Groups</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your teams and track their growth metrics
            </p>
          </div>
          <CreateGroupModal
            onSuccess={(groupData) => {
              mutate("api/growth/groups");
              toast.success("Group created successfully");
            }}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <FormControl
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="[&_.input]:pl-10 [&_.input]:bg-white"
          />
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {groups.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No groups found" : "No Groups Yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? `No groups match "${searchQuery}". Try a different search term.`
                : "Create your first group to start tracking growth metrics for your teams."}
            </p>
            {!searchQuery && <CreateGroupModal />}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[80px] text-center">Sr. No</TableHead>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Number of Clients</TableHead>
                  <TableHead className="text-center">Created Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group, index) => (
                  <GroupRow
                    key={group._id}
                    group={group}
                    index={index}
                    onViewReport={handleViewReport}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupRow({ group, index, onViewReport }) {
  const router = useRouter();

  const clientCount = Array.isArray(group.clients) ? group.clients.length : 0;
  const createdDate = group.createdAt
    ? format(parseISO(group.createdAt), "dd-MM-yyyy")
    : "—";
  const isActive = group.isActive !== false; // Default to true if not specified

  const handleViewReport = () => {
    router.push(`/coach/growth/dashboard?group=${group._id}`);
  };

  return (
    <TableRow className="hover:bg-slate-50 transition-colors">
      <TableCell className="text-center text-sm font-medium text-slate-700">
        {index + 1}
      </TableCell>
      <TableCell>
        <button
          onClick={() => onViewReport(group._id)}
          className="font-semibold text-slate-900 hover:text-[var(--accent-1)] transition-colors text-left"
        >
          {group.name}
        </button>
      </TableCell>
      <TableCell>
        <div className="text-sm text-slate-600 max-w-md truncate">
          {group.description || "—"}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{clientCount}</span>
        </div>
      </TableCell>
      <TableCell className="text-center text-sm text-slate-600">{createdDate}</TableCell>
      <TableCell className="text-center">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewReport}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <AddClientsToGroupModal
            groupId={group._id}
            onSuccess={() => {
              mutate("api/growth/groups");
              toast.success("Clients added successfully");
            }}
          >
            <Button variant="ghost" size="sm" className="h-8">
              <Users className="h-4 w-4 mr-1" />
              Add
            </Button>
          </AddClientsToGroupModal>
        </div>
      </TableCell>
    </TableRow>
  );
}

