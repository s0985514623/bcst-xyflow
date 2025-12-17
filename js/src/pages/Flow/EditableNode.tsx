import { useCallback, useState, memo, useRef } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'

// 預設顏色選項
export const NODE_COLORS = [
  { name: '透明', bg: 'transparent', border: 'transparent', text: '#334155' },
  { name: '白色', bg: '#ffffff', border: '#e2e8f0', text: '#334155' },
  { name: '藍色', bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  { name: '綠色', bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  { name: '黃色', bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  { name: '橘色', bg: '#ffedd5', border: '#f97316', text: '#c2410c' },
  { name: '紅色', bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
  { name: '紫色', bg: '#f3e8ff', border: '#a855f7', text: '#7e22ce' },
  { name: '粉色', bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
  { name: '灰色', bg: '#f1f5f9', border: '#64748b', text: '#334155' },
]

// 預設顏色（白色）
export const DEFAULT_NODE_COLOR = NODE_COLORS[1]

export interface NodeColor {
  bg: string
  border: string
  text: string
}

export interface EditableNodeData {
  label?: string
  color?: NodeColor
}

interface EditableNodeProps {
  id: string
  data: EditableNodeData
  selected?: boolean
}

/**
 * 將 HEX 顏色轉換為 RGBA
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * 從 RGBA 或 HEX 提取基礎顏色的 HEX 值
 */
function extractBaseHex(color: string): string {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
  }
  return color.startsWith('#') ? color : '#ffffff'
}

/**
 * 從顏色字串提取透明度
 */
function extractAlpha(color: string): number {
  if (color === 'transparent') return 0
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\([^)]+,\s*([\d.]+)\)/)
    if (match) return parseFloat(match[1])
  }
  return 1
}

/**
 * 根據背景色計算適合的邊框色和文字色
 */
function generateColorFromHex(hexColor: string, alpha: number = 1): NodeColor {
  // 移除 # 號
  const hex = hexColor.replace('#', '')

  // 轉換為 RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // 計算亮度 (0-255)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // 生成較深的邊框色 (降低亮度 30%)
  const darken = (value: number) => Math.max(0, Math.floor(value * 0.7))
  const borderR = darken(r)
  const borderG = darken(g)
  const borderB = darken(b)
  const borderColor = `#${borderR.toString(16).padStart(2, '0')}${borderG.toString(16).padStart(2, '0')}${borderB.toString(16).padStart(2, '0')}`

  // 根據背景亮度決定文字色
  const textColor = brightness > 128 ? '#1e293b' : '#ffffff'

  // 如果有透明度，使用 RGBA
  const bgColor = alpha < 1 ? hexToRgba(hexColor, alpha) : hexColor

  return {
    bg: bgColor,
    border: borderColor,
    text: textColor,
  }
}

/**
 * 處理文字中的換行符
 * 將字面的 \n 字串轉換為實際的換行符
 */
export function processLabel(label: string | undefined): string {
  if (!label) return '未命名'
  // 將字面的 \n 轉換為實際換行符
  return label.replace(/\\n/g, '\n')
}

/**
 * Editable Node Component - 可編輯標籤的節點
 */
function EditableNode({ id, data, selected }: EditableNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [inputValue, setInputValue] = useState(processLabel(data?.label))
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { setNodes, deleteElements } = useReactFlow()

  // Get current color or default
  const currentColor: NodeColor = data?.color || DEFAULT_NODE_COLOR

  // 計算當前透明度
  const currentAlpha = extractAlpha(currentColor.bg)

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
    setInputValue(processLabel(data?.label))
  }, [data?.label])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    // Update node data
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, label: inputValue } }
          : node,
      ),
    )
  }, [id, inputValue, setNodes])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter 或 Cmd+Enter 保存
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleBlur()
      }
      // Escape 取消編輯
      if (e.key === 'Escape') {
        setIsEditing(false)
        setInputValue(processLabel(data?.label))
      }
      // 阻止事件冒泡，避免觸發 ReactFlow 的快捷鍵
      e.stopPropagation()
    },
    [handleBlur, data?.label],
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      deleteElements({ nodes: [{ id }] })
    },
    [id, deleteElements],
  )

  const handleColorChange = useCallback(
    (color: NodeColor) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  color: { bg: color.bg, border: color.border, text: color.text },
                },
              }
            : node,
        ),
      )
      setShowColorPicker(false)
    },
    [id, setNodes],
  )

  // 處理自訂顏色
  const handleCustomColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hexColor = e.target.value
      const generatedColor = generateColorFromHex(hexColor, currentAlpha)
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  color: generatedColor,
                },
              }
            : node,
        ),
      )
    },
    [id, setNodes, currentAlpha],
  )

  // 處理透明度變更
  const handleAlphaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const alpha = parseFloat(e.target.value)
      const baseHex = extractBaseHex(currentColor.bg)
      const generatedColor = generateColorFromHex(baseHex, alpha)
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  color: generatedColor,
                },
              }
            : node,
        ),
      )
    },
    [id, setNodes, currentColor.bg],
  )

  const openCustomColorPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    colorInputRef.current?.click()
  }, [])

  const toggleColorPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowColorPicker((prev) => !prev)
  }, [])

  // 判斷是否為完全透明
  const isFullyTransparent =
    currentColor.bg === 'transparent' && currentColor.border === 'transparent'

  return (
    <div
      className={`editable-node ${selected ? 'selected' : ''} ${isFullyTransparent ? 'transparent-node' : ''}`}
      style={{
        backgroundColor: currentColor.bg,
        borderColor: currentColor.border,
      }}
    >
      {/* 四個方向的連接點 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ backgroundColor: currentColor.border }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ backgroundColor: currentColor.border }}
      />

      {/* 工具按鈕 */}
      {selected && (
        <div className="node-toolbar">
          {/* 顏色選擇按鈕 */}
          <button
            type="button"
            className="node-color-btn"
            onClick={toggleColorPicker}
            title="選擇顏色"
            style={{ backgroundColor: currentColor.border }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 22C6.49 22 2 17.51 2 12S6.49 2 12 2s10 4.04 10 9c0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7z" />
              <circle cx="6.5" cy="11.5" r="1.5" />
              <circle cx="9.5" cy="7.5" r="1.5" />
              <circle cx="14.5" cy="7.5" r="1.5" />
              <circle cx="17.5" cy="11.5" r="1.5" />
            </svg>
          </button>

          {/* 刪除按鈕 */}
          <button
            type="button"
            className="node-delete-btn"
            onClick={handleDelete}
            title="刪除節點"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* 顏色選擇器 */}
      {showColorPicker && (
        <div className="node-color-picker">
          {/* 預設顏色 */}
          <div className="color-options">
            {NODE_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                className={`color-option ${
                  currentColor.bg === color.bg ? 'active' : ''
                } ${color.bg === 'transparent' ? 'transparent-option' : ''}`}
                style={{
                  backgroundColor: color.bg,
                  borderColor: color.border,
                }}
                onClick={() => handleColorChange(color)}
                title={color.name}
              />
            ))}
            {/* 自訂顏色按鈕 */}
            <button
              type="button"
              className="color-option custom-color"
              onClick={openCustomColorPicker}
              title="自訂顏色"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          {/* 透明度滑桿 */}
          <div className="alpha-slider">
            <span className="alpha-label">透明度</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentAlpha}
              onChange={handleAlphaChange}
              className="alpha-input"
            />
            <span className="alpha-value">{Math.round(currentAlpha * 100)}%</span>
          </div>
          {/* 隱藏的顏色輸入 */}
          <input
            ref={colorInputRef}
            type="color"
            className="hidden-color-input"
            value={extractBaseHex(currentColor.bg)}
            onChange={handleCustomColorChange}
          />
        </div>
      )}

      <div className="node-content" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="node-input node-textarea"
            autoFocus
            rows={3}
            placeholder="輸入文字，按 Enter 換行"
          />
        ) : (
          <span
            className="node-label"
            style={{ color: currentColor.text, whiteSpace: 'pre-wrap' }}
          >
            {processLabel(data?.label)}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(EditableNode)

