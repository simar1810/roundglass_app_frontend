"use client";
import ContentError from "@/components/common/ContentError";
import ContentLoader from "@/components/common/ContentLoader";
import ClientListItemStatus from "@/components/pages/coach/client/ClientListItemStatus";
import Paginate from "@/components/Paginate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAppClients, getUserClients, getUsers } from "@/lib/fetchers/app";
import { getAllGroups } from "@/lib/fetchers/growth";
import { useAppSelector } from "@/providers/global/hooks";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import TeamDataExport from "@/components/pages/roundglass/TeamDataExport";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUserType } from "@/lib/permissions";
import { getClientRosterCoachLabel } from "@/lib/client/clientRosterCoach";

const initialQuery = {
  page: 1,
  limit: 50,
  finalPage: Infinity
}

export default function Page() {
  const isCoachView = getUserType() === "coach";
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedGroups, setSelectedGroups] = useState([])
  const [query, setQuery] = useState(() => initialQuery);
  const coach = useAppSelector(state => state.coach.data);
  const { client_categories = [] } = coach;
  // clientId -> { userId, userName }
  const [clientManagedByMap, setClientManagedByMap] = useState(new Map());
  const [selectedManagedByUserId, setSelectedManagedByUserId] = useState("all");

  const categories = useMemo(() => {
    const map = new Map();
    for (const category of client_categories) {
      map.set(category._id, category.name)
    }
    return map;
  })

  const { isLoading, error, data } = useSWR(
    `getAppClients-all`,
    () => getAppClients({ limit: 10000 }) // Fetch all clients
  );

  const { data: groupsRes } = useSWR(
    "api/growth/groups",
    () => getAllGroups()
  );

  const { data: usersRes } = useSWR(
    coach?._id ? `api/users?coachId=${coach._id}` : null,
    () => getUsers(coach?._id)
  );

  const groups = useMemo(
    () => (Array.isArray(groupsRes?.data) ? groupsRes.data : []),
    [groupsRes]
  );

  const groupIdToName = useMemo(() => new Map(groups.map(g => [g._id, g.name])), [groups]);

  const clientIdToGroupIds = useMemo(() => {
    const map = new Map();
    for (const group of groups) {
      const members = Array.isArray(group?.clients) ? group.clients : [];
      for (const client of members) {
        const id = client?._id;
        if (!id) continue;
        const prev = map.get(id) || [];
        prev.push(group._id);
        map.set(id, prev);
      }
    }
    return map;
  }, [groups]);

  // Build mapping: clientId -> user.name (who manages the player)
  useEffect(() => {
    let cancelled = false;

    async function buildClientManagedBy() {
      if (!isCoachView) {
        if (!cancelled) setClientManagedByMap(new Map());
        return;
      }
      const users =
        usersRes?.status_code === 200 && Array.isArray(usersRes?.data)
          ? usersRes.data
          : [];
      const allClients = Array.isArray(data?.data) ? data.data : [];
      if (!users.length || !allClients.length) return;

      const clientIdSet = new Set(allClients.map(c => c?._id).filter(Boolean));
      // clientId -> single manager (per your business rule).
      const map = new Map();
      for (const user of users) {
        if (!user?._id) continue;
        const response = await getUserClients(user._id, 1, 1000);
        if (response?.status_code !== 200) continue;

        const assignedClients = response?.data?.clients || [];
        for (const assignedClient of assignedClients) {
          const id = assignedClient?._id;
          if (!id || !clientIdSet.has(id)) continue;
          // Keep first manager encountered; duplicates indicate backend issue.
          if (!map.has(id)) {
            map.set(id, {
              userId: user._id,
              userName: user?.name || user?.userId || "",
            });
          }
        }
      }

      if (!cancelled) {
        setClientManagedByMap(map);
      }
    }

    buildClientManagedBy();
    return () => {
      cancelled = true;
    };
  }, [isCoachView, usersRes, data?.data]);

  useEffect(() => {
    setQuery(prev => ({ ...prev, page: 1 }));
  }, [selectedCategories, selectedGroups]);

  if (isLoading) return <ContentLoader />

  if (error || data?.status_code !== 200) return <ContentError title={error || data?.message} />

  // Get all clients from API response and implement frontend pagination
  const allClients = Array.isArray(data?.data) ? data.data : [];

  // Apply category filter
  let clients = allClients;
  if (selectedCategories.length > 0) {
    clients = clients.filter(client =>
      client?.categories?.some(category => selectedCategories.includes(category))
    );
  }

  // Apply group filter
  if (selectedGroups.length > 0) {
    clients = clients.filter(client => {
      const memberships = clientIdToGroupIds.get(client?._id) || [];
      return memberships.some(groupId => selectedGroups.includes(groupId));
    });
  }

  // Apply managed-by user filter
  if (isCoachView && selectedManagedByUserId !== "all") {
    clients = clients.filter((client) => {
      const entry = clientManagedByMap.get(client?._id);
      return entry?.userId === selectedManagedByUserId;
    });
  }

  // Apply pagination after filtering
  const totalClients = clients.length;
  const totalPages = Math.ceil(totalClients / query.limit);
  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;
  const currentClients = clients.slice(startIndex, endIndex);

  return <div className="mt-8 content-container">
    <div className="flex flex-col gap-4 md:gap-0 md:flex-row items-start justify-between mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
        <Header
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          categories={client_categories}
        />
        {isCoachView && (
          <ManagedByUserFilter
            users={Array.isArray(usersRes?.data) ? usersRes.data : []}
            selectedUserId={selectedManagedByUserId}
            onChange={setSelectedManagedByUserId}
          />
        )}
        <GroupsFilter
          groups={groups}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
        />
        <TeamDataExport
          defaultCategoryIds={selectedCategories}
          defaultFormat="excel"
          variant="outline"
          size="sm"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y-1">
      {currentClients.map((client, index) => (
        <ClientListItemStatus
          key={index}
          categories={categories}
          groups={clientIdToGroupIds.get(client?._id) || []}
          groupNames={groupIdToName}
          client={client}
          rosterCoachLabel={getClientRosterCoachLabel(client)}
          managedByUserName={isCoachView ? clientManagedByMap.get(client?._id)?.userName : undefined}
        />
      ))}
    </div>

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="mt-8">
        <Paginate
          totalPages={totalPages}
          totalResults={totalClients}
          limit={query.limit}
          page={query.page}
          onChange={(newQuery) => setQuery(prev => ({ ...prev, ...newQuery }))}
        />
      </div>
    )}
  </div>
}

function Header({
  selectedCategories,
  setSelectedCategories,
  categories
}) {
  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const handleSelectAll = () => {
    const allIds = categories.map((category) => category._id)
    setSelectedCategories(allIds)
  }

  const handleReset = () => {
    setSelectedCategories([])
  }

  const getSelectedNames = () => {
    if (selectedCategories.length === 0) return "Select categories"
    if (selectedCategories.length === categories.length) return "All categories"
    if (selectedCategories.length === 1) {
      const category = categories.find((cat) => cat._id === selectedCategories[0])
      return category?.name || "1 category"
    }
    return `${selectedCategories.length} categories`
  }

  return (
    <div className="w-full max-w-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-transparent">
            {getSelectedNames()}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Filter Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="flex gap-1 p-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs flex-1" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs flex-1" onClick={handleReset}>
              Reset
            </Button>
          </div>

          <DropdownMenuSeparator />

          {categories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category._id}
              checked={selectedCategories.includes(category._id)}
              onCheckedChange={() => handleCategoryToggle(category._id)}
            >
              {category.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedCategories.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          Selected:{" "}
          {selectedCategories
            .map((id) => {
              const category = categories.find((cat) => cat._id === id)
              return category?.name
            })
            .join(", ")}
        </div>
      )}
    </div>
  )
}

function GroupsFilter({ groups = [], selectedGroups, setSelectedGroups }) {
  const handleToggle = (groupId) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    )
  }

  const handleSelectAll = () => {
    const allIds = groups.map((g) => g._id)
    setSelectedGroups(allIds)
  }

  const handleReset = () => {
    setSelectedGroups([])
  }

  const getSelectedNames = () => {
    if (!groups.length) return "Groups"
    if (selectedGroups.length === 0) return "Select groups"
    if (selectedGroups.length === groups.length) return "All groups"
    if (selectedGroups.length === 1) {
      const g = groups.find((x) => x._id === selectedGroups[0])
      return g?.name || "1 group"
    }
    return `${selectedGroups.length} groups`
  }

  return (
    <div className="w-full max-w-xs">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-transparent"
            disabled={!groups.length}
          >
            {getSelectedNames()}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>Filter Groups</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="flex gap-1 p-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs flex-1" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs flex-1" onClick={handleReset}>
              Reset
            </Button>
          </div>
          <DropdownMenuSeparator />
          {groups.map((g) => (
            <DropdownMenuCheckboxItem
              key={g._id}
              checked={selectedGroups.includes(g._id)}
              onCheckedChange={() => handleToggle(g._id)}
            >
              {g.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ManagedByUserFilter({ users = [], selectedUserId, onChange }) {
  const getLabel = () => {
    if (!users.length) return "Managed user";
    if (!selectedUserId || selectedUserId === "all") return "Managed user";
    const u = users.find((x) => x._id === selectedUserId);
    return u?.name || "Managed user";
  };

  return (
    <div className="w-full max-w-xs">
      <Select
        value={selectedUserId}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger className="bg-transparent">
          <SelectValue placeholder={getLabel()} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All managed users</SelectItem>
          {users.map((user) => (
            <SelectItem key={user._id} value={user._id}>
              {user?.name || user?.userId || "User"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
