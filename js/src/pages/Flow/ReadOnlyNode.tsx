import { memo, useCallback } from 'react'
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

  // 當前連結
  const currentLink = data?.link || ''

  // 判斷是否為完全透明
  const isFullyTransparent =
    currentColor.bg === 'transparent' && currentColor.border === 'transparent'

  // 處理連結點擊 - 阻止事件冒泡讓 ReactFlow 不會攔截
  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.stopPropagation()
      // 讓瀏覽器正常處理連結跳轉
    },
    [],
  )

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

      {/* Info 連結圖標 - 只在有連結時顯示 */}
      {currentLink && (
        <div className="node-info-link">
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            title={currentLink}
            onClick={handleLinkClick}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24 37C25.3807 37 26.5 35.8807 26.5 34.5C26.5 33.1193 25.3807 32 24 32C22.6193 32 21.5 33.1193 21.5 34.5C21.5 35.8807 22.6193 37 24 37Z"
                fill="currentColor"
              />
              <path
                d="M24 12V28"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}

export default memo(ReadOnlyNode)

