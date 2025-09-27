"use client";

import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data/peer";
import { toast } from "sonner";
import Cookies from "js-cookie";

const TreeVisualizer = ({ initialNode }) => {
	const visJsRef = useRef(null);
	const nodes = useRef(new DataSet()).current;
	const edges = useRef(new DataSet()).current;
	const [expandedNodes, setExpandedNodes] = useState(new Set());
	console.log(initialNode);
	const expandNode = async (nodeId) => {
		if (!nodeId || expandedNodes.has(nodeId)) {
			return;
		}
		try {
			const response = await fetch(`http://localhost:8080/api/app/downline/visualizer/${nodeId}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				}
			});
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
						function calcInit(node) {
							if (node.label.split(" ").length === 1) {
								return node.label.split(" ")[0][0];
							} else {
								return (
									node.label.split(" ")[0][0] +
									" " +
									node.label.split(" ")[1][0]
								);
							}
						}
						return {
							...node,
							title: tooltipElement,
							label: calcInit(node),
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
		const data = {nodes, edges};
		const options = {
			layout: {
				hierarchical: {
					direction: "UD",
					sortMethod: "directed",
					levelSeparation: 100,
					nodeSpacing: 150,
				},
			},

			physics: {
				enabled: true,
			},
			nodes: {
				shape: "circle",
				size: 25,
				font: { size: 14, color: "#ffffff", face: "Arial" },
  				widthConstraint: { minimum: 80, maximum: 120 },
  				color: {
    				border: "#67BC2A",
    				background: "#1e293b",
    				highlight: { border: "#ffffff", background: "#334155" },
    				hover: { border: "#ffffff", background: "#475569" },
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
			if (params.nodes.length > 0) {
				const nodeId = params.nodes[0];
				expandNode(nodeId);
			}
		});
		if (initialNode && nodes.length === 0) {
			const initialTooltipElement = document.createElement("div");
			initialTooltipElement.innerHTML = initialNode.title;
			nodes.add({
				...initialNode,
				title: initialTooltipElement,
			});
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
