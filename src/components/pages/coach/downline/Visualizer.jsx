"use client";

import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data/peer";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { nameInitials } from "@/lib/formatter";

const colorFromString = (str) => {
	let hash = 0;
	if (!str || str.length === 0) return "#cccccc";
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	let color = "#";
	for (let i = 0; i < 3; i++) {
		let value = (hash >> (i * 8)) & 0xff;
		color += ("00" + value.toString(16)).substr(-2);
	}
	return color;
};

const TreeVisualizer = ({ initialNode }) => {
	const visJsRef = useRef(null);
	const nodes = useRef(new DataSet()).current;
	const edges = useRef(new DataSet()).current;
	const [expandedNodes, setExpandedNodes] = useState(new Set());

	const expandNode = async (nodeId) => {
		if (!nodeId || expandedNodes.has(nodeId)) return;

		try {
			const response = await fetch(`/api/downline/${nodeId}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to fetch downline data");
			}

			const body = await response.json();

			if (body.status_code === 200 && body.data) {
				const { nodes: newNodes, edges: newEdges } = body.data;

				if (newNodes && newNodes.length > 0) {
					const nodesWithDetails = newNodes.map((node) => {
						const tooltipElement = document.createElement("div");
						tooltipElement.innerHTML = `
                            <div style="padding: 5px; color: #333;">
                                <p style="margin: 0;"><b>Name:</b> ${node.label
							}</p>
                                <p style="margin: 0;"><b>ID:</b> ${node.coachId
							}</p>
                                <p style="margin: 0;"><b>Email:</b> ${node.email
							}</p>
                                <p style="margin: 0;"><b>Clients:</b> ${node.totalClients || 0
							}</p>
                            </div>
                        `;
						return {
							...node,
							label: nameInitials(node.label),
							title: tooltipElement,
							color: {
								border: colorFromString(node.categoryName),
								background: "#3c3c3c",
							},
						};
					});

					const edgesWithIds = newEdges.map((edge) => ({
						...edge,
						id: `${edge.from}-${edge.to}`,
					}));
					nodes.update(nodesWithDetails);
					edges.update(edgesWithIds);
				}
				setExpandedNodes((prev) => new Set(prev).add(nodeId));
			}
		} catch (error) {
			toast.error(error.message);
		}
	};

	useEffect(() => {
		const data = { nodes, edges };
		const options = {
			physics: { enabled: true },
			nodes: {
				shape: "circle",
				size: 25,
				font: { size: 16, color: "#e0e0e0", face: "Arial" },
				borderWidth: 3,
				color: {
					highlight: { border: "#ffffff", background: "#555555" },
					hover: { border: "#ffffff", background: "#444444" },
				},
			},
			edges: {
				width: 2,
				arrows: { to: { enabled: true, scaleFactor: 0.8 } },
				color: { color: "#666666", highlight: "#00aeff", hover: "#888888" },
			},
			interaction: {
				hover: true,
				tooltipDelay: 200,
				navigationButtons: true,
			},
		};

		const network =
			visJsRef.current && new Network(visJsRef.current, data, options);

		network?.on("click", (params) => {
			if (params.nodes.length > 0) expandNode(params.nodes[0]);
		});
		if (initialNode && nodes.length === 0) {
			const initialTooltipElement = document.createElement("div");
			initialTooltipElement.innerHTML = initialNode.title;
			nodes.add({
				...initialNode,
				title: initialTooltipElement,
				color: {
					...initialNode.color,
					border: colorFromString(initialNode.categoryName),
				},
			});
			// nodes.add(nodeToAdd);
		}

		return () => {
			network?.destroy();
		};
	}, [initialNode]);

	return (
		<div
			ref={visJsRef}
			style={{
				height: "70vh",
				width: "100%",
				background: "#22272e",
				borderRadius: "8px",
			}}
		/>
	);
};

export default TreeVisualizer;
