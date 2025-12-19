import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface LineEndpointData {
  // 關聯的另一個端點 ID
  pairedEndpointId?: string
  // 關聯的邊 ID
  edgeId?: string
  // 是否為起點（用於決定箭頭方向）
  isStart?: boolean
  [key: string]: unknown
}

interface LineEndpointProps extends NodeProps {
  data: LineEndpointData
}

/**
 * 線條端點節點 - 用於創建獨立可調整的線條
 * 兩個端點 + 一條邊 = 一條可自由調整的線條
 */
export default function LineEndpoint({ data, selected }: LineEndpointProps) {
  const isStart = data?.isStart ?? true

  return (
    <div className={`line-endpoint ${selected ? 'selected' : ''}`}>
      {/* 端點視覺圓點 */}
      <div className="endpoint-dot" />

      {/* 連接點 - 根據是否為起點決定位置 */}
      {isStart ? (
        // 起點：連接點在右側（作為 source）
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="endpoint-handle"
        />
      ) : (
        // 終點：連接點在左側（作為 target）
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="endpoint-handle"
        />
      )}
    </div>
  )
}

/**
 * 唯讀模式的線條端點 - 隱藏端點，只顯示線條
 */
export function ReadOnlyLineEndpoint() {
  return (
    <div className="line-endpoint readonly">
      {/* 唯讀模式下端點完全透明 */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="endpoint-handle hidden"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="endpoint-handle hidden"
      />
    </div>
  )
}
