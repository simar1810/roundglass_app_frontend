"use client";
import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nameInitials } from "@/lib/formatter";
import { useState } from "react";
import FormControl from "@/components/FormControl";
import DualOptionActionModal from "@/components/modals/DualOptionActionModal";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { sendData, fetchData } from "@/lib/api";
import { toast } from "sonner";
import { useAppSelector } from "@/providers/global/hooks";
import ContentError from "@/components/common/ContentError";
import useSWR from "swr";
import ContentLoader from "@/components/common/ContentLoader";
import {
	retrieveDownlineCoaches,
	retrieveDownlineRequests,
} from "@/lib/fetchers/app";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TreeVisualizer from "@/components/pages/coach/downline/Visualizer";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { ManageCategoryModal } from "@/components/modals/coach/ManageCategoryModal";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const categoriesFetcher = () =>
	fetchData("app/coach-categories").then((res) => {
		if (res.status_code !== 200) throw new Error(res.message);
		return res.data;
	});

export default function Page() {
	const { data: coachData } = useAppSelector((state) => state.coach);
	const { downline = {}, features } = coachData;

	const {
		data: categories,
		error: categoriesError,
		isLoading: categoriesLoading,
		mutate: mutateCategories,
	} = useSWR("coach-categories", categoriesFetcher);

	const handleDeleteCategory = async (setLoading, closeBtnRef, categoryId) => {
		setLoading(true);
		try {
			const response = await sendData(
				`app/coach-categories/${categoryId}`,
				{},
				"DELETE"
			);
			if (response.status_code !== 200) throw new Error(response.message);
			toast.success("Category deleted successfully.");
			mutateCategories();
			closeBtnRef.current.click();
		} catch (err) {
			toast.error(err.message || "Failed to delete category.");
		} finally {
			setLoading(false);
		}
	};

	if (!features?.includes(5)) {
		return <ContentError title="This feature isn't enabled for you" />;
	}

	if (!["requested", "in-downline"].includes(downline?.status)) {
		return (
			<div className="content-height-screen content-container flex items-center justify-center">
				<StartDownline />
			</div>
		);
	}

	const initialNodeData = {
		id: coachData._id,
		label: nameInitials(coachData.name),
		categoryName: coachData.coachCategory?.name || "Uncategorized",
		title: `
            <div style="padding: 5px; color: #333;">
                <p style="margin: 0;"><b>Name:</b> ${coachData.name}</p>
                <p style="margin: 0;"><b>Category:</b> ${coachData.coachCategory?.name || "Uncategorized"
			}</p>
                <p style="margin: 0;"><b>ID:</b> ${coachData.coachId}</p>
            </div>
        `,
	};

	return (
		<div className="content-container content-height-screen">
			{downline.status === "requested" && <Invitations />}
			{downline.status === "in-downline" && (
				<Tabs defaultValue="list" className="w-full">
					<TabsList className="grid w-full max-w-md mx-auto mb-4 grid-cols-3">
						<TabsTrigger value="list">List View</TabsTrigger>
						<TabsTrigger value="visualizer">Visualizer</TabsTrigger>
						<TabsTrigger value="manageCategories">
							Manage Categories
						</TabsTrigger>
					</TabsList>

					<TabsContent value="list">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<CreateInvitation />
							<CoachesList />
						</div>
					</TabsContent>

					<TabsContent value="visualizer">
						<Card className="bg-gray-800 border-gray-700">
							<CardContent className="p-4">
								<h4 className="text-xl mb-4 text-center font-semibold text-white">
									Downline Visualizer
								</h4>
								<TreeVisualizer initialNode={initialNodeData} />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="manageCategories">
						{categoriesLoading && <ContentLoader />}
						{categoriesError && (
							<ContentError title={categoriesError.message} />
						)}
						{categories && (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h2 className="text-3xl font-bold">Manage Your Categories</h2>
									<ManageCategoryModal onSave={mutateCategories}>
										<Button>
											<PlusCircle className="mr-2 h-4 w-4" /> Create New
											Category
										</Button>
									</ManageCategoryModal>
								</div>
								<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
									{categories.map((category) => (
										<Card
											key={category._id}
											className="flex flex-col bg-white dark:bg-slate-800"
										>
											<CardHeader>
												<CardTitle className="flex items-center justify-between">
													{category.name}
													<div className="flex items-center space-x-2">
														<ManageCategoryModal
															category={category}
															onSave={mutateCategories}
														>
															<Button variant="ghost" size="icon">
																<Edit className="h-4 w-4" />
															</Button>
														</ManageCategoryModal>
														<DualOptionActionModal
															title="Delete Category"
															description={`Are you sure you want to delete the "${category.name}" category?`}
															action={(setLoading, btnRef) =>
																handleDeleteCategory(
																	setLoading,
																	btnRef,
																	category._id
																)
															}
														>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="icon"
																	className="text-red-500 hover:text-red-600"
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</AlertDialogTrigger>
														</DualOptionActionModal>
													</div>
												</CardTitle>
											</CardHeader>
											<CardContent className="flex-grow space-y-4">
												<p className="text-sm text-gray-500 dark:text-gray-400">
													{category.description}
												</p>
												<div>
													<h4 className="font-semibold text-base">
														Permissions:
													</h4>
													<ul className="list-disc pl-5 text-sm space-y-1 mt-2">
														<li>
															Club Access:{" "}
															<b>{category.permissions.clubAccess}</b>
														</li>
														<li>
															Category Creation:{" "}
															<b>
																{category.permissions.categoryCreationAccess}
															</b>
														</li>
														<li>
															Downline Management:{" "}
															<b>
																{category.permissions.downlineManagementAccess}
															</b>
														</li>
													</ul>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
								{categories.length === 0 && (
									<p className="text-center py-8 text-gray-500">
										You haven't created any categories yet.
									</p>
								)}
							</div>
						)}
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}

// --- The functions below remain unchanged ---

function Invitations() {
	const { isLoading, error, data } = useSWR("app/downline", () =>
		retrieveDownlineRequests()
	);

	if (isLoading) return <ContentLoader />;

	if (error || data.status_code !== 200)
		return <ContentError title={error || data.message} />;

	const invitations = data?.data || [];

	if (invitations.length === 0) return <></>;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="!text-[28px]">Invitations</h4>
				<StartDownline />
			</div>
			{invitations.map((invitation, index) => (
				<Card
					className="w-full max-w-md bg-[var(--comp-1)] border-2 border-[var(--accent-1)] rounded-lg p-0"
					key={index}
				>
					<CardContent className="flex flex-col gap-4 p-4">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-md overflow-hidden">
								<Avatar className="h-[60px] w-[60px] border-1">
									<AvatarImage src={invitation.profilePhoto} />
									<AvatarFallback>
										{nameInitials(invitation.name)}
									</AvatarFallback>
								</Avatar>
							</div>

							<div className="flex flex-col">
								<h2 className="text-lg font-semibold">
									{invitation.name}{" "}
									<span className="text-gray-500 text-sm">
										#{invitation.coachId}
									</span>
								</h2>
								<p className="text-sm text-gray-600">{invitation.email}</p>
								<p className="text-sm text-gray-600">
									{invitation.mobileNumber}
								</p>
							</div>
						</div>
						<hr />
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-400">
								Respond to this Invitation
							</p>
							<div className="flex gap-2">
								<ActionOnRequest
									actionType="ACCEPT_INVITE"
									coachId={invitation._id}
								>
									<Button
										variant="default"
										className="bg-green-500 hover:bg-green-600"
									>
										Confirm
									</Button>
								</ActionOnRequest>
								<ActionOnRequest
									actionType="DECLINE_INVITE"
									coachId={invitation._id}
								>
									<Button
										variant="default"
										className="bg-red-500 hover:bg-red-600"
									>
										Decline
									</Button>
								</ActionOnRequest>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function CreateInvitation() {
	const [coachId, setCoachId] = useState("");
	return (
		<div className="bg-[var(--comp-2)] w-full grow px-4 py-8 border-1 rounded-[8px]">
			<h4 className="mb-4">Invite a Coach</h4>
			<div className="flex flex-col gap-4">
				<FormControl
					type="text"
					placeholder="Enter Coach ID"
					value={coachId}
					onChange={(e) => setCoachId(e.target.value)}
					className="h-12"
				/>
				{coachId.length > 0 && (
					<ActionOnRequest coachId={coachId} actionType="INVITE">
						<Button variant="wz" className="max-w-xs w-full mx-auto">
							Invite Coach
						</Button>
					</ActionOnRequest>
				)}
			</div>
		</div>
	);
}

function CoachesList() {
	const { isLoading, error, data } = useSWR(
		"app/downline/coaches",
		retrieveDownlineCoaches
	);

	if (isLoading) return <ContentLoader />;

	if (error || data.status_code !== 200)
		return <ContentError title={error?.message || data.message} />;

	const coaches = data?.data || [];
	return (
		<div className="bg-[var(--comp-1)] px-4 py-8 rounded-[8px] space-y-2 border-1">
			<h4 className="mb-4">Coaches under You {coaches.length}</h4>
			<div className="divide-y-1">
				{coaches.map((coach, index) => (<div
					key={index}
					className="flex items-center justify-between hover:bg-white pr-4"
				>
					<Link
						href={`/coach/downline/coach/${coach._id}`}
						className="w-full flex items-center justify-between p-2"
					>
						<div className="flex items-center gap-3">
							<Avatar className="rounded-[8px] w-12 h-12 border-1">
								<AvatarImage src={coach.profilePhoto} alt="Symond Write" />
								<AvatarFallback className="rounded-[8px]">
									{nameInitials(coach.name)}
								</AvatarFallback>
							</Avatar>
							<div className="font-medium text-base grow">{coach.name}</div>
						</div>
					</Link>
					<SyncCoachComponent coach={coach} />
				</div>))}
			</div>
			{coaches.length === 0 && (
				<div className="h-[150px] flex items-center justify-center">
					No coach under you!
				</div>
			)}
		</div>
	);
}

function StartDownline() {
	async function startDownline(setLoading, closeBtnRef) {
		try {
			setLoading(true);
			const response = await sendData("app/downline/requests", {}, "PUT");
			if (response.status_code !== 200) throw new Error(response.message);
			toast.success(response.message);
			closeBtnRef.current.click();
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<DualOptionActionModal
			asChild
			description="Are you sure to start your downline?"
			action={(setLoading, btnRef) => startDownline(setLoading, btnRef)}
		>
			<AlertDialogTrigger asChild>
				<Button variant="wz">Start Downline</Button>
			</AlertDialogTrigger>
		</DualOptionActionModal>
	);
}

function ActionOnRequest({
	children,
	actionType,
	coachId
}) {
	async function actionOnRequest(setLoading) {
		try {
			setLoading(true);
			const response = await sendData("app/downline/requests", { actionType, coachId }, "PATCH");
			if (response.status_code !== 200) throw new Error(response.message);
			toast.success(response.message);
			location.reload()
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	}

	return <DualOptionActionModal
		action={(setLoading, btnRef) => actionOnRequest(setLoading, btnRef)}
	>
		<AlertDialogTrigger asChild>
			{children}
		</AlertDialogTrigger>
	</DualOptionActionModal>
}
const syncStatus = { 1: "Requested", 2: "Synced", 3: "Unsync" }
const syncBadgeVariant = { 1: "primary", 2: "wz_fill", 3: "destructive" }

function SyncCoachComponent({ coach }) {
	const { clubType } = useAppSelector(state => state.coach.data)
	if (!["Club Leader", "System Leader"].includes(clubType)) return <></>
	return <div className="ml-auto flex items-center gap-2">
		{coach.super_coach && <Badge
			variant={syncBadgeVariant[coach.super_coach?.status]}
		>
			{syncStatus[coach.super_coach?.status]}
		</Badge>}
		<SyncCoachModal coachId={coach._id} />
	</div>
}

function SyncCoachModal({ coachId }) {
	const [loading, setLoading] = useState(false);

	const closeBtnRef = useRef();

	async function changeSyncStatus(status) {
		try {
			setLoading(true);
			const response = await sendData(`app/sync-coach/super`, { status, coachId });
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

	return <Dialog>
		<DialogTrigger asChild>
			<Button size="sm" variant="wz">Sync</Button>
		</DialogTrigger>
		<DialogContent className="!max-w-[500px] max-h-[70vh] overflow-y-auto gap-0 border-0 p-0">
			<DialogHeader className="py-4 px-6 border-b">
				<DialogTitle className="text-lg font-semibold">
					Update The Club Sync Status
				</DialogTitle>
			</DialogHeader>
			<div className="p-4">
				<Button
					onClick={() => changeSyncStatus(2)}
					disabled={loading}
					variant="wz"
					className="mt-0 mr-4"
				>Sync</Button>
				<Button
					onClick={() => changeSyncStatus(3)}
					disabled={loading}
					variant="destructive"
					className="mt-0"
				>Unsync</Button>
				<DialogClose ref={closeBtnRef} />
			</div>
		</DialogContent>
	</Dialog>
}