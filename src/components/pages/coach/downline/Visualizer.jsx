"use client";

import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data/peer";
import { toast } from "sonner";
import { fetchData } from "@/lib/api";

const options = {
	layout: {
		hierarchical: {
			enabled: false
		},
	},
	physics: {
		enabled: true,
		forceAtlas2Based: {
			theta: 0.5,
			gravitationalConstant: -50,
			centralGravity: 0.01,
			springConstant: 0.08,
			springLength: 100,
			damping: 0.4,
			avoidOverlap: 0
		},
		repulsion: {
			centralGravity: 0.2,
			springLength: 200,
			springConstant: 0.05,
			nodeDistance: 100,
			damping: 0.09
		},
		hierarchicalRepulsion: {
			centralGravity: 0.0,
			springLength: 100,
			springConstant: 0.01,
			nodeDistance: 120,
			damping: 0.09,
			avoidOverlap: 0
		},
		maxVelocity: 50,
		minVelocity: 0.1,
		solver: 'barnesHut',
		stabilization: {
			enabled: true,
			iterations: 1000,
			updateInterval: 100,
			onlyDynamicEdges: false,
			fit: true
		},
		timestep: 0.5,
		adaptiveTimestep: true,
		wind: { x: 0, y: 0 }
	},
	nodes: {
		shape: "circle",
		size: 25,
		font: { size: 16, color: "#e0e0e0", face: "Arial" },
		borderWidth: 2,
		color: {
			border: "#00aeff",
			background: "#3c3c3c",
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

const TreeVisualizer = ({ initialNode }) => {
	const [networkInstance, setNetworkInstance] = useState(null);
	const [expandedNodes, setExpandedNodes] = useState(new Set());

	const visJsRef = useRef(null);
	const nodes = useRef(new DataSet()).current;
	const edges = useRef(new DataSet()).current;

	const expandNode = async (nodeId) => {
		if (!nodeId || expandedNodes.has(nodeId)) {
			return;
		}
		try {
			// const token = Cookies.get("token");
			// console.log(token)
			// if (!token) {
			// 	toast.error("Authentication token not found.");
			// 	return;
			// }

			const body = await fetchData(`app/downline/visualizer/${nodeId}`);
			if (body.status_code !== 200) {
				const errorData = await response.json();
				// throw new Error(errorData.message || "Failed to fetch downline data");
				toast.error(errorData.message || "Failed to fetch downline data");
				return;
			}

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
							if (node.label.split(" ").length == 1) {
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
		const data = { nodes, edges };

		const network = visJsRef.current && new Network(visJsRef.current, data, options);

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
				color: {
					...initialNode.color,
					// border: colorFromString(initialNode.categoryName),
				},
			});
		}
		setNetworkInstance(network);
		return () => {
			network?.destroy();
			setNetworkInstance(null);
		};
	}, [initialNode]);

	const listNodes = Array
		.from(nodes?._data || new Map())
		.map(([item]) => item) || []
	// console.log(typeof listNodes)
	return (<>
		<div
			ref={visJsRef}
			style={{
				height: "70vh",
				width: "100%",
				background: "#22272e",
				borderRadius: "8px",
			}}
		/>
		{/* {listNodes.map(node => <CoachActions
			key={Object.values(networkInstance?.getPosition(node)).join("-")}
			coachData={nodes._data.get(node)}
			positions={networkInstance?.getPosition(node)}
		/>)} */}
	</>
	);
};

function CoachActions({
	coachData,
	positions
}) {
	return <div
		className="absolute top-0 left-0 text-white text-xs bg-black bg-opacity-50 p-1 rounded z-[1000000]"
		style={{
			transform: `translate(${positions?.x}px, ${positions?.y}px)`,
			pointerEvents: 'none'
		}}
	>
		{coachData?.label} - {positions?.x}, {positions?.y}
	</div>
}

export default TreeVisualizer;