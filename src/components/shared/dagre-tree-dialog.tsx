"use client";

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type DagreTreeLayoutDirection,
  type DagreTreeRoot,
  treeToFlowElements,
} from "@/lib/utils/dagre-tree";

import "@xyflow/react/dist/style.css";

export type DagreTreeDialogLabels = {
  vertical: string;
  horizontal: string;
  empty: string;
};

export type DagreTreeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  root: DagreTreeRoot;
  labels: DagreTreeDialogLabels;
  /** When true (default), nodes can be dragged; edges stay attached. */
  nodesDraggable?: boolean;
};

function DagreTreeFlow({
  root,
  direction,
  emptyLabel,
  nodesDraggable,
}: {
  root: DagreTreeRoot;
  direction: DagreTreeLayoutDirection;
  emptyLabel: string;
  nodesDraggable: boolean;
}) {
  const { fitView } = useReactFlow();
  const hasChildren = Boolean(root.children?.length);

  const layouted = useMemo(
    () =>
      hasChildren
        ? treeToFlowElements(root, direction)
        : { nodes: [], edges: [] },
    [root, direction, hasChildren],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layouted.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layouted.edges);

  useEffect(() => {
    if (!hasChildren) {
      setNodes([]);
      setEdges([]);
      return;
    }
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [hasChildren, layouted, setNodes, setEdges]);

  useEffect(() => {
    if (!hasChildren || layouted.nodes.length === 0) return;
    const frame = requestAnimationFrame(() => {
      fitView({ padding: 0.2 });
    });
    return () => cancelAnimationFrame(frame);
  }, [fitView, hasChildren, layouted]);

  if (!hasChildren) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={nodesDraggable}
        nodesConnectable={false}
        elementsSelectable={nodesDraggable}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function DagreTreeDialog({
  open,
  onOpenChange,
  title,
  root,
  labels,
  nodesDraggable = true,
}: DagreTreeDialogProps) {
  const [direction, setDirection] =
    useState<DagreTreeLayoutDirection>("vertical");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(80vh,720px)] max-w-5xl flex-col sm:max-w-5xl">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle>{title}</DialogTitle>
          <ToggleGroup
            type="single"
            value={direction}
            onValueChange={(value) => {
              if (value === "vertical" || value === "horizontal") {
                setDirection(value);
              }
            }}
            variant="outline"
            size="sm"
            className="mr-5"
          >
            <ToggleGroupItem value="vertical" aria-label={labels.vertical}>
              {labels.vertical}
            </ToggleGroupItem>
            <ToggleGroupItem value="horizontal" aria-label={labels.horizontal}>
              {labels.horizontal}
            </ToggleGroupItem>
          </ToggleGroup>
        </DialogHeader>
        <div className="min-h-0 flex-1 rounded-lg border">
          <ReactFlowProvider>
            <div className="h-full w-full">
              <DagreTreeFlow
                root={root}
                direction={direction}
                emptyLabel={labels.empty}
                nodesDraggable={nodesDraggable}
              />
            </div>
          </ReactFlowProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
