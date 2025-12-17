import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  DEFAULT_NODE_COLOR,
  processLabel,
  type EditableNodeData,
  type NodeColor,
} from './EditableNode'

interface ReadOnlyNodeProps {
  data: EditableNodeData
}

/**
 * Read-only Node Component - 只讀模式的節點
 * 連接點隱藏但保留以讓線路能正確連接
 */
function ReadOnlyNode({ data }: ReadOnlyNodeProps) {
  // Get current color or default
  const currentColor: NodeColor = data?.color || DEFAULT_NODE_COLOR

  // 處理標籤文字
  const displayLabel = processLabel(data?.label)

  // 判斷是否為完全透明
  const isFullyTransparent =
    currentColor.bg === 'transparent' && currentColor.border === 'transparent'

  // 隱藏連接點的樣式
  const hiddenHandleStyle = {
    opacity: 0,
    width: 1,
    height: 1,
    minWidth: 1,
    minHeight: 1,
    pointerEvents: 'none' as const,
  }

  return (
    <div
      className={`readonly-node ${isFullyTransparent ? 'transparent-node' : ''}`}
      style={{
        backgroundColor: currentColor.bg,
        borderColor: currentColor.border,
      }}
    >
      {/* 四個方向的連接點（隱藏但保留用於線路連接） */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        isConnectable={false}
        style={hiddenHandleStyle}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        isConnectable={false}
        style={hiddenHandleStyle}
      />

      <div className="node-content">
        <span
          className="node-label"
          style={{ color: currentColor.text, whiteSpace: 'pre-wrap' }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  )
}

export default memo(ReadOnlyNode)

