import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from '@xyflow/react'
import { useState, useCallback } from 'react'

// 預設的邊樣式選項
export const edgeStyleOptions = [
  { id: 'solid', label: '實線', strokeDasharray: undefined },
  { id: 'dashed', label: '虛線', strokeDasharray: '8 4' },
  { id: 'dotted', label: '點線', strokeDasharray: '2 2' },
  { id: 'dash-dot', label: '點虛線', strokeDasharray: '8 4 2 4' },
] as const

export type EdgeStyleType = (typeof edgeStyleOptions)[number]['id']

export interface CustomEdgeData {
  strokeDasharray?: string
  edgeStyle?: EdgeStyleType
  [key: string]: unknown
}

interface CustomEdgeProps extends EdgeProps {
  data?: CustomEdgeData
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: CustomEdgeProps) {
  const { setEdges } = useReactFlow()
  const [showStylePicker, setShowStylePicker] = useState(false)

  // 計算路徑
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  // 從 data 獲取樣式
  const strokeDasharray = data?.strokeDasharray

  // 處理樣式變更
  const handleStyleChange = useCallback(
    (styleId: EdgeStyleType) => {
      const selectedStyle = edgeStyleOptions.find((opt) => opt.id === styleId)
      if (!selectedStyle) return

      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                edgeStyle: styleId,
                strokeDasharray: selectedStyle.strokeDasharray,
              },
              style: {
                ...edge.style,
                strokeDasharray: selectedStyle.strokeDasharray,
              },
            }
          }
          return edge
        }),
      )
      setShowStylePicker(false)
    },
    [id, setEdges],
  )

  // 獲取當前選中的樣式
  const currentStyleId = data?.edgeStyle || 'solid'

  return (
    <>
      {/* 主要邊路徑 */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray,
        }}
      />

      {/* 可點擊的透明路徑（增加點擊區域） */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />

      {/* 邊標籤渲染器 - 用於顯示編輯工具 */}
      <EdgeLabelRenderer>
        {/* 選中時顯示樣式切換按鈕 */}
        {selected && (
          <div
            className="edge-style-button-wrapper"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <button
              type="button"
              className="edge-style-btn"
              onClick={(e) => {
                e.stopPropagation()
                setShowStylePicker(!showStylePicker)
              }}
              title="變更線條樣式"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            {/* 樣式選擇器 */}
            {showStylePicker && (
              <div
                className="edge-style-picker"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="edge-style-title">線條樣式</div>
                <div className="edge-style-options">
                  {edgeStyleOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`edge-style-option ${currentStyleId === option.id ? 'active' : ''}`}
                      onClick={() => handleStyleChange(option.id)}
                    >
                      <svg width="40" height="12" viewBox="0 0 40 12">
                        <line
                          x1="2"
                          y1="6"
                          x2="38"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={option.strokeDasharray}
                        />
                      </svg>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
