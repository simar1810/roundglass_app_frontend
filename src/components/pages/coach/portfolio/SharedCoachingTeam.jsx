"use client";

import FormControl from "@/components/FormControl";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import {
  addCoachTeamMember,
  createCoachTeam,
  getCoachTeam,
} from "@/lib/fetchers/app";
import { copyText } from "@/lib/utils";
import { useAppSelector } from "@/providers/global/hooks";
import { Clipboard, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

function apiMessage(res, fallback) {
  if (!res || typeof res !== "object") return fallback;
  return res.message || fallback;
}

export default function SharedCoachingTeam() {
  const myCoachId = useAppSelector((state) => state.coach.data?.coachId);
  const { data, error, isLoading, mutate } = useSWR("coach-team", getCoachTeam, {
    revalidateOnFocus: true,
  });

  const [memberInput, setMemberInput] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [addBusy, setAddBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[120px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error?.message || "Could not load shared team. Try again later."}
      </p>
    );
  }

  if (data?.status_code !== 200) {
    return (
      <p className="text-sm text-destructive">
        {apiMessage(data, "Could not load shared team.")}
      </p>
    );
  }

  const team = data?.data?.team ?? null;

  async function onCreateTeam() {
    try {
      setCreateBusy(true);
      const res = await createCoachTeam();
      if (res?.status_code === 200 || res?.status_code === 201) {
        toast.success(res.message || "Shared team created");
        await mutate();
        return;
      }
      toast.error(apiMessage(res, "Could not create team"));
      if (res?.data?.teamId != null) await mutate();
    } catch (e) {
      toast.error(e?.message || "Could not create team");
    } finally {
      setCreateBusy(false);
    }
  }

  async function onAddMember(e) {
    e?.preventDefault?.();
    const memberCoachId = memberInput.trim();
    if (!memberCoachId) {
      toast.error("Enter the other coach's coach ID");
      return;
    }
    if (String(myCoachId) === memberCoachId) {
      toast.error("You can't add yourself to the team");
      return;
    }
    try {
      setAddBusy(true);
      const res = await addCoachTeamMember(memberCoachId);
      if (res?.status_code === 200 || res?.status_code === 201) {
        toast.success(res.message || "Coach added to the team");
        setMemberInput("");
        await mutate();
        return;
      }
      toast.error(apiMessage(res, "Could not add coach"));
    } catch (e) {
      toast.error(e?.message || "Could not add coach");
    } finally {
      setAddBusy(false);
    }
  }

  if (!team) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
        <p className="text-sm text-[var(--dark-2)] leading-relaxed">
          Create a shared team so multiple coaches can work from the same client roster. After you
          create a team, add other coaches using their public coach ID (the ID shown on their
          profile). Everyone on the team sees the same clients on existing screens—no change to how
          you use client lists.
        </p>
        <Button
          type="button"
          variant="wz"
          disabled={createBusy}
          onClick={onCreateTeam}
          className="w-full sm:w-auto"
        >
          {createBusy ? "Creating…" : "Create shared team"}
        </Button>
      </div>
    );
  }

  const rows = buildMemberRows(team);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            No members listed yet.
          </div>
        ) : (
          rows.map((row, idx) => (
            <div
              key={row.key}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--dark-2)] truncate">
                  {row.name || `Coach ${idx + 1}`}
                </p>
                <p className="text-sm text-muted-foreground font-mono">ID #{row.coachId}</p>
                {row.email ? (
                  <p className="text-sm text-muted-foreground truncate">{row.email}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onAddMember} className="space-y-3 rounded-xl border border-slate-200 p-4 bg-white">
        <div className="flex items-center gap-2 text-[var(--dark-2)]">
          <UserPlus className="w-4 h-4 text-[var(--accent-1)]" />
          <span className="font-semibold text-sm">Add coach</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the other coach's public coach ID (from their profile).
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <FormControl
            className="flex-1 block mb-0"
            label="Coach ID"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            placeholder="e.g. 12345"
            disabled={addBusy}
          />
          <Button type="submit" variant="wz" disabled={addBusy} className="sm:shrink-0">
            {addBusy ? "Adding…" : "Add coach"}
          </Button>
        </div>
      </form>

      {team.teamId ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono select-all break-all">Team ID: {team.teamId}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[var(--accent-1)]"
            onClick={() => {
              copyText(String(team.teamId));
              toast.success("Team ID copied");
            }}
          >
            <Clipboard className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** @param {Record<string, unknown>} team */
function buildMemberRows(team) {
  const members = Array.isArray(team.members) ? team.members : [];
  if (members.length > 0) {
    return members.map((m, i) => ({
      key: m.coachId || m._id || `m-${i}`,
      name: m.name,
      coachId: m.coachId != null ? String(m.coachId) : "—",
      email: m.email,
    }));
  }
  const ids = team.memberCoachIdStrings?.length
    ? team.memberCoachIdStrings
    : team.memberCoachIds?.map(String) || [];
  return ids.map((id, i) => ({
    key: `id-${id}-${i}`,
    name: null,
    coachId: String(id),
    email: null,
  }));
}
