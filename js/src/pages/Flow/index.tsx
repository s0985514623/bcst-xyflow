import { useCallback, useState, useEffect, useMemo, useRef } from 'react'
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
  getNodesBounds,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useGetFlowData, useSaveFlowData } from '@/hooks'
import Toolbar from './Toolbar'
import EditableNode from './EditableNode'
import ReadOnlyNode from './ReadOnlyNode'
import CustomEdge from './CustomEdge'
import LineEndpoint, { ReadOnlyLineEndpoint } from './LineEndpoint'
import type { FlowData } from '@/types/flow'

// Custom node types for editable mode
const editableNodeTypes = {
  editable: EditableNode,
  default: EditableNode,
  lineEndpoint: LineEndpoint,
}

// Custom node types for readonly mode
const readOnlyNodeTypes = {
  editable: ReadOnlyNode,
  default: ReadOnlyNode,
  lineEndpoint: ReadOnlyLineEndpoint,
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

// 唯讀畫布四周的留白 (px)
const READONLY_PADDING = 6

// 自動高度模式在流程圖尚未載入前的畫布高度 (px)
const AUTO_HEIGHT_PLACEHOLDER = 400

// 自動高度的上限：視窗高度的比例，避免直長型流程圖撐出好幾個螢幕高
const AUTO_HEIGHT_MAX_RATIO = 0.85

interface FlowEditorProps {
  readOnly?: boolean
  postId?: number
  autoHeight?: boolean // 唯讀時畫布高度依流程圖比例自動決定（容器未指定高度時）
}

// 主要 Flow 編輯器組件
function FlowEditor({
  readOnly = false,
  postId,
  autoHeight = false,
}: FlowEditorProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const { getViewport, setViewport, fitView } = useReactFlow()
  const canvasRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Node[]>(nodes)
  nodesRef.current = nodes
  const [canvasHeight, setCanvasHeight] = useState<number>()

  // 唯讀模式的取景：四周只留 READONLY_PADDING。
  // 自動高度時讓流程圖填滿畫布寬度，再依比例回推畫布高度，上下就不會多出留白；
  // 但倍率不超過 1（不放大原圖），高度不超過視窗的 AUTO_HEIGHT_MAX_RATIO，
  // 受限時改以高度為準並水平置中。
  // 固定高度（短碼有指定 height）時退回 fitView。
  // 用 setViewport 而非帶 duration 的動畫：背景分頁的 rAF 會被節流，動畫可能停在半途。
  const fitReadOnly = useCallback(() => {
    const canvas = canvasRef.current
    const currentNodes = nodesRef.current
    if (!canvas || currentNodes.length === 0) return

    if (!autoHeight) {
      fitView({ padding: `${READONLY_PADDING}px` })
      return
    }

    const bounds = getNodesBounds(currentNodes)
    const width = canvas.clientWidth
    if (!width || !bounds.width) return

    const maxHeight = Math.max(
      AUTO_HEIGHT_PLACEHOLDER,
      Math.round(window.innerHeight * AUTO_HEIGHT_MAX_RATIO),
    )
    const zoom = Math.min(
      1,
      (width - READONLY_PADDING * 2) / bounds.width,
      (maxHeight - READONLY_PADDING * 2) / bounds.height,
    )
    setCanvasHeight(Math.ceil(bounds.height * zoom + READONLY_PADDING * 2))
    setViewport({
      x: (width - bounds.width * zoom) / 2 - bounds.x * zoom,
      y: READONLY_PADDING - bounds.y * zoom,
      zoom,
    })
  }, [autoHeight, fitView, setViewport])

  // 畫布寬度改變（視窗縮放、RWD）時重新取景；
  // 畫布在資料載入後才渲染，所以依 hasNodes 重新掛上 observer
  const hasNodes = nodes.length > 0
  useEffect(() => {
    const canvas = canvasRef.current
    if (!readOnly || !canvas) return

    let lastWidth = canvas.clientWidth
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === lastWidth) return
      lastWidth = canvas.clientWidth
      fitReadOnly()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [readOnly, fitReadOnly, hasNodes])

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

      // 在唯讀模式下，依畫布取景（見 fitReadOnly）
      // 在編輯模式下，恢復保存的 viewport
      if (readOnly) {
        // 延遲執行確保 React Flow 已準備好
        setTimeout(fitReadOnly, 150)
      } else if (viewport) {
        setTimeout(() => {
          setViewport(viewport)
        }, 100)
      }
    }
  }, [flowResponse, setViewport, fitReadOnly, readOnly])

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

  // Add background block (edit mode only)
  // 直接帶 zIndex: -1，才會落到連線圖層下方當底色；預設半透明，
  // 讓使用者一眼看得出這是背景而不是一般節點
  const addBackgroundNode = useCallback(() => {
    if (readOnly) return
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'editable',
      position: {
        x: Math.round(Math.random() * 120) + 40,
        y: Math.round(Math.random() * 120) + 40,
      },
      width: 600,
      height: 300,
      zIndex: -1,
      data: {
        label: ' ',
        color: {
          bg: 'rgba(148, 163, 184, 0.25)',
          border: '#cbd5e1',
          text: '#334155',
        },
      },
    }
    setNodes((prev) => [...prev, newNode])
  }, [readOnly])

  // Add new line (two endpoints + edge) (edit mode only)
  const addNewLine = useCallback(() => {
    if (readOnly) return

    const timestamp = Date.now()
    const startId = `line_start_${timestamp}`
    const endId = `line_end_${timestamp}`
    const edgeId = `line_edge_${timestamp}`

    // 隨機位置
    const baseX = Math.random() * 200 + 100
    const baseY = Math.random() * 200 + 100

    // 創建起點節點
    const startNode: Node = {
      id: startId,
      type: 'lineEndpoint',
      position: { x: baseX, y: baseY },
      data: {
        isStart: true,
        pairedEndpointId: endId,
        edgeId: edgeId,
      },
    }

    // 創建終點節點（水平偏移 150px）
    const endNode: Node = {
      id: endId,
      type: 'lineEndpoint',
      position: { x: baseX + 150, y: baseY },
      data: {
        isStart: false,
        pairedEndpointId: startId,
        edgeId: edgeId,
      },
    }

    // 創建連接兩個端點的邊（獨立線條不需要箭頭）
    const lineEdge: Edge = {
      ...defaultEdgeOptions,
      id: edgeId,
      source: startId,
      target: endId,
      sourceHandle: 'source',
      targetHandle: 'target',
      markerEnd: undefined, // 獨立線條不顯示箭頭
      data: {
        edgeStyle: 'solid',
        strokeDasharray: undefined,
        isLine: true, // 標記這是獨立線條
      },
    }

    setNodes((prev) => [...prev, startNode, endNode])
    setEdges((prev) => [...prev, lineEdge])
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

  // Handle node changes
  // 唯讀模式也必須套用變更，否則 fitView 會失效：
  // React Flow 的 fitView() 只是把 fitViewQueued 設為 true 並排入 node queue，
  // 真正執行要等 queue handler 呼叫 setNodes；handler 在有變更時走的是
  // onNodesChange，若這裡直接 return，佇列中的 fitView 就永遠不會被觸發。
  // 唯讀的限制由 nodesDraggable / elementsSelectable 等旗標把關，
  // 此時 React Flow 只會產生 dimensions 類變更，套用它才是正確行為。
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  // Handle edge changes（同上，唯讀模式也要套用）
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

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
    <div
      className={`xyflow-container ${readOnly ? 'readonly' : ''} ${
        readOnly && autoHeight ? 'auto-height' : ''
      }`}
    >
      {/* Only show toolbar in edit mode */}
      {!readOnly && (
        <Toolbar
          onAddNode={addNewNode}
          onAddLine={addNewLine}
          onAddBackground={addBackgroundNode}
          onSave={handleSave}
          onClear={clearCanvas}
          isSaving={isSaving}
          isLoading={isLoading}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      )}

      <div
        className="xyflow-canvas"
        ref={canvasRef}
        style={
          readOnly && autoHeight
            ? { height: canvasHeight ?? AUTO_HEIGHT_PLACEHOLDER }
            : undefined
        }
      >
        {/*
          fitView：唯讀模式由 fitReadOnly 取景，避免內建 fitView 在節點量測後覆蓋。
          minZoom：預設 0.5 會讓大型流程圖無法完整取景；窄螢幕下自動高度的倍率可能更低。
        */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={customEdgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={!readOnly}
          minZoom={0.05}
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
          {/*
            唯讀畫布四周只留 6px，左下角常壓到流程圖內容（如列標題），
            改放右下角並橫排；「適合畫面」也沿用相同留白
          */}
          {readOnly ? (
            <Controls
              showInteractive={false}
              position="bottom-right"
              orientation="horizontal"
              fitViewOptions={{ padding: `${READONLY_PADDING}px` }}
            />
          ) : (
            <Controls showInteractive={false} />
          )}
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
  autoHeight?: boolean
}

// Wrapper component with ReactFlowProvider
export default function Flow({
  readOnly = false,
  postId,
  autoHeight = false,
}: FlowProps) {
  return (
    <ReactFlowProvider>
      <FlowEditor readOnly={readOnly} postId={postId} autoHeight={autoHeight} />
    </ReactFlowProvider>
  )
}
