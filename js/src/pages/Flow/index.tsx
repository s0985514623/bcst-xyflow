import { useCallback, useState, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
  MarkerType,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGetFlowData, useSaveFlowData } from '@/hooks'
import Toolbar from './Toolbar'
import EditableNode from './EditableNode'
import ReadOnlyNode from './ReadOnlyNode'
import CustomEdge from './CustomEdge'
import type { FlowData } from '@/types/flow'

// Custom node types for editable mode
const editableNodeTypes = {
  editable: EditableNode,
  default: EditableNode,
}

// Custom node types for readonly mode
const readOnlyNodeTypes = {
  editable: ReadOnlyNode,
  default: ReadOnlyNode,
}

// Custom edge types
const customEdgeTypes = {
  custom: CustomEdge,
  default: CustomEdge,
}

// Default edge style
const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#64748b',
    width: 20,
    height: 20,
  },
  style: {
    stroke: '#64748b',
    strokeWidth: 2,
  },
}

interface FlowEditorProps {
  readOnly?: boolean
  postId?: number
}

// 主要 Flow 編輯器組件
function FlowEditor({ readOnly = false, postId }: FlowEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { getViewport, setViewport, fitView } = useReactFlow()

  // Fetch flow data from WordPress (使用傳入的 postId 或全域設定)
  const { data: flowResponse, isLoading, isError, error } = useGetFlowData(postId)

  // Save mutation (only used in edit mode)
  const { mutate: saveFlow, isLoading: isSaving } = useSaveFlowData(postId)

  // Select node types based on mode
  const nodeTypes = useMemo(
    () => (readOnly ? readOnlyNodeTypes : editableNodeTypes),
    [readOnly],
  )

  // Load initial data from WordPress
  useEffect(() => {
    if (flowResponse?.data?.flow_data) {
      const {
        nodes: savedNodes,
        edges: savedEdges,
        viewport,
      } = flowResponse.data.flow_data

      if (savedNodes && savedNodes.length > 0) {
        setNodes(savedNodes)
      }
      if (savedEdges && savedEdges.length > 0) {
        setEdges(savedEdges)
      }

      // 在唯讀模式下，fitView 讓節點置中
      // 在編輯模式下，恢復保存的 viewport
      if (readOnly) {
        // 延遲執行 fitView 確保 React Flow 已準備好
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 300 })
        }, 150)
      } else if (viewport) {
        setTimeout(() => {
          setViewport(viewport)
        }, 100)
      }
    }
  }, [flowResponse, setViewport, fitView, readOnly])

  // Add new node (edit mode only)
  const addNewNode = useCallback(() => {
    if (readOnly) return
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'editable',
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
      data: { label: '新節點' },
    }
    setNodes((prev) => [...prev, newNode])
  }, [readOnly])

  // Clear all nodes and edges (edit mode only)
  const clearCanvas = useCallback(() => {
    if (readOnly) return
    if (window.confirm('確定要清空畫布嗎？此操作無法復原。')) {
      setNodes([])
      setEdges([])
    }
  }, [readOnly])

  // Save flow data (edit mode only)
  const handleSave = useCallback(() => {
    if (readOnly) return
    const viewport = getViewport()
    const flowData: FlowData = {
      nodes,
      edges,
      viewport,
    }

    saveFlow(flowData, {
      onSuccess: () => {
        alert('儲存成功！')
      },
      onError: (err) => {
        console.error('Save error:', err)
        alert('儲存失敗，請稍後再試。')
      },
    })
  }, [readOnly, nodes, edges, getViewport, saveFlow])

  // Handle node changes (edit mode only)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) return
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [readOnly],
  )

  // Handle edge changes (edit mode only)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return
      setEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [readOnly],
  )

  // Handle new connections (edit mode only)
  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            ...defaultEdgeOptions,
            data: {
              edgeStyle: 'solid',
              strokeDasharray: undefined,
            },
          },
          eds,
        ),
      )
    },
    [readOnly],
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="xyflow-container">
        <div className="xyflow-loading">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="xyflow-container">
        <div className="xyflow-error">
          <p>載入失敗：{(error as Error)?.message || '未知錯誤'}</p>
          <button onClick={() => window.location.reload()}>重新載入</button>
        </div>
      </div>
    )
  }

  // Empty state for readonly mode
  if (readOnly && nodes.length === 0) {
    return (
      <div className="xyflow-container">
        <div className="xyflow-empty">
          <p>尚無流程圖資料</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`xyflow-container ${readOnly ? 'readonly' : ''}`}>
      {/* Only show toolbar in edit mode */}
      {!readOnly && (
        <Toolbar
          onAddNode={addNewNode}
          onSave={handleSave}
          onClear={clearCanvas}
          isSaving={isSaving}
          isLoading={isLoading}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      )}

      <div className="xyflow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={customEdgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          snapToGrid={!readOnly}
          snapGrid={[15, 15]}
          deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          edgesFocusable={!readOnly}
          edgesReconnectable={!readOnly}
          panOnDrag={true}
          zoomOnScroll={true}
        >
          <Background color="#e2e8f0" gap={15} />
          <Controls showInteractive={false} />
          {!readOnly && (
            <MiniMap
              nodeColor={(node) => {
                if (node.selected) return '#3b82f6'
                return '#94a3b8'
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          )}
        </ReactFlow>
      </div>

      {/* Only show tips in edit mode */}
      {!readOnly ? (
        <div className="xyflow-tips">
          <span>
            💡 提示：雙擊編輯文字 | 格式：*斜體* **粗體** ~~刪除線~~ | 調色盤換顏色 | Ctrl+Enter 保存
          </span>
        </div>
      ) : (
        <div className="xyflow-tips readonly">
          <span>💡 提示：可使用滑鼠滾輪縮放、拖曳移動畫布</span>
        </div>
      )}
    </div>
  )
}

interface FlowProps {
  readOnly?: boolean
  postId?: number
}

// Wrapper component with ReactFlowProvider
export default function Flow({ readOnly = false, postId }: FlowProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor readOnly={readOnly} postId={postId} />
    </ReactFlowProvider>
  )
}
