import { useCallback, useState, memo, useRef } from 'react'
import { Handle, Position, useReactFlow, NodeResizer } from '@xyflow/react'
import React from 'react'

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

// 文字對齊類型
export type TextAlign = 'left' | 'center' | 'right'

// 文字樣式介面
export interface TextStyle {
  fontSize?: number // 字體大小 (px)
  bold?: boolean // 粗體
  italic?: boolean // 斜體
  underline?: boolean // 底線
  textAlign?: TextAlign // 對齊方式
}

// 預設文字樣式
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 13,
  bold: false,
  italic: false,
  underline: false,
  textAlign: 'center',
}

// 可選字體大小
export const FONT_SIZES = [10, 12, 13, 14, 16, 18, 20, 24, 28, 32]

export interface EditableNodeData {
  label?: string
  color?: NodeColor
  link?: string // 站內連結 URL（點擊節點跳轉，不開新分頁）
  infoLink?: string // 外部連結 URL（info 按鈕，開新分頁）
  textStyle?: TextStyle // 文字樣式
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
 * 解析富文本標記並轉換為 React 元素
 * 支援的格式：
 * - **粗體** 或 __粗體__
 * - *斜體* 或 _斜體_
 * - ~~刪除線~~
 * - 可以組合使用，如 ***粗斜體***
 */
interface TextSegment {
  text: string
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
}

function parseRichText(text: string): TextSegment[] {
  const segments: TextSegment[] = []

  // 正則表達式匹配各種格式
  // 匹配順序：粗斜體 > 粗體 > 斜體 > 刪除線 > 普通文字
  const pattern =
    /(\*\*\*(.+?)\*\*\*)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(_([^_]+)_)|(~~(.+?)~~)/g

  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    // 添加匹配前的普通文字
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      // ***粗斜體***
      segments.push({ text: match[2], bold: true, italic: true })
    } else if (match[3]) {
      // **粗體**
      segments.push({ text: match[4], bold: true })
    } else if (match[5]) {
      // __粗體__
      segments.push({ text: match[6], bold: true })
    } else if (match[7]) {
      // *斜體*
      segments.push({ text: match[8], italic: true })
    } else if (match[9]) {
      // _斜體_
      segments.push({ text: match[10], italic: true })
    } else if (match[11]) {
      // ~~刪除線~~
      segments.push({ text: match[12], strikethrough: true })
    }

    lastIndex = match.index + match[0].length
  }

  // 添加剩餘的普通文字
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) })
  }

  // 如果沒有任何匹配，返回原始文字
  if (segments.length === 0) {
    segments.push({ text })
  }

  return segments
}

/**
 * 渲染富文本元素
 */
interface RichTextProps {
  text: string
  baseStyle?: React.CSSProperties
}

export function RichText({ text, baseStyle = {} }: RichTextProps) {
  const processedText = processLabel(text)

  // 按換行符分割處理
  const lines = processedText.split('\n')

  return (
    <>
      {lines.map((line, lineIndex) => {
        const segments = parseRichText(line)
        return (
          <React.Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {segments.map((segment, segIndex) => {
              const style: React.CSSProperties = {
                ...baseStyle,
                fontWeight: segment.bold ? 'bold' : baseStyle.fontWeight,
                fontStyle: segment.italic ? 'italic' : baseStyle.fontStyle,
                textDecoration: segment.strikethrough
                  ? 'line-through'
                  : baseStyle.textDecoration,
              }

              return (
                <span key={`${lineIndex}-${segIndex}`} style={style}>
                  {segment.text}
                </span>
              )
            })}
          </React.Fragment>
        )
      })}
    </>
  )
}

/**
 * Editable Node Component - 可編輯標籤的節點
 */
function EditableNode({ id, data, selected }: EditableNodeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkEditor, setShowLinkEditor] = useState(false)
  const [showInfoLinkEditor, setShowInfoLinkEditor] = useState(false)
  const [showTextStyleEditor, setShowTextStyleEditor] = useState(false)
  const [inputValue, setInputValue] = useState(processLabel(data?.label))
  const [linkValue, setLinkValue] = useState(data?.link || '')
  const [infoLinkValue, setInfoLinkValue] = useState(data?.infoLink || '')
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { setNodes, deleteElements } = useReactFlow()

  // Get current color or default
  const currentColor: NodeColor = data?.color || DEFAULT_NODE_COLOR

  // 計算當前透明度
  const currentAlpha = extractAlpha(currentColor.bg)

  // 當前連結
  const currentLink = data?.link || ''

  // 當前外部連結
  const currentInfoLink = data?.infoLink || ''

  // 當前文字樣式
  const currentTextStyle: TextStyle = data?.textStyle || DEFAULT_TEXT_STYLE

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
    setShowLinkEditor(false)
    setShowInfoLinkEditor(false)
    setShowTextStyleEditor(false)
  }, [])

  // 站內連結編輯相關函數
  const toggleLinkEditor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowLinkEditor((prev) => !prev)
    setShowColorPicker(false)
    setShowTextStyleEditor(false)
    setShowInfoLinkEditor(false)
    setLinkValue(currentLink)
  }, [currentLink])

  // 外部連結（info-link）編輯相關函數
  const toggleInfoLinkEditor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInfoLinkEditor((prev) => !prev)
    setShowColorPicker(false)
    setShowTextStyleEditor(false)
    setShowLinkEditor(false)
    setInfoLinkValue(currentInfoLink)
  }, [currentInfoLink])

  // 文字樣式編輯相關函數
  const toggleTextStyleEditor = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowTextStyleEditor((prev) => !prev)
    setShowColorPicker(false)
    setShowLinkEditor(false)
    setShowInfoLinkEditor(false)
  }, [])

  // 更新文字樣式
  const updateTextStyle = useCallback(
    (newStyle: Partial<TextStyle>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  textStyle: {
                    ...currentTextStyle,
                    ...newStyle,
                  },
                },
              }
            : node,
        ),
      )
    },
    [id, setNodes, currentTextStyle],
  )

  // 切換粗體
  const toggleBold = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      updateTextStyle({ bold: !currentTextStyle.bold })
    },
    [updateTextStyle, currentTextStyle.bold],
  )

  // 切換斜體
  const toggleItalic = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      updateTextStyle({ italic: !currentTextStyle.italic })
    },
    [updateTextStyle, currentTextStyle.italic],
  )

  // 切換底線
  const toggleUnderline = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      updateTextStyle({ underline: !currentTextStyle.underline })
    },
    [updateTextStyle, currentTextStyle.underline],
  )

  // 變更字體大小
  const handleFontSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      e.stopPropagation()
      updateTextStyle({ fontSize: parseInt(e.target.value, 10) })
    },
    [updateTextStyle],
  )

  // 設定對齊方式
  const setTextAlign = useCallback(
    (align: TextAlign) => (e: React.MouseEvent) => {
      e.stopPropagation()
      updateTextStyle({ textAlign: align })
    },
    [updateTextStyle],
  )

  const handleLinkSave = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, link: linkValue.trim() } }
          : node,
      ),
    )
    setShowLinkEditor(false)
  }, [id, linkValue, setNodes])

  const handleLinkRemove = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, link: '' } }
          : node,
      ),
    )
    setShowLinkEditor(false)
  }, [id, setNodes])

  // 外部連結保存
  const handleInfoLinkSave = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, infoLink: infoLinkValue.trim() } }
          : node,
      ),
    )
    setShowInfoLinkEditor(false)
  }, [id, infoLinkValue, setNodes])

  // 外部連結移除
  const handleInfoLinkRemove = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, infoLink: '' } }
          : node,
      ),
    )
    setShowInfoLinkEditor(false)
  }, [id, setNodes])

  // 判斷是否為完全透明
  const isFullyTransparent =
    currentColor.bg === 'transparent' && currentColor.border === 'transparent'

  return (
    <div
      className={`editable-node ${selected ? 'selected' : ''} ${isFullyTransparent ? 'transparent-node' : ''} ${currentInfoLink ? 'has-info-link' : ''}`}
      style={{
        backgroundColor: currentColor.bg,
        borderColor: currentColor.border,
      }}
    >
      {/* 節點大小調整器 - 選中時顯示 */}
      <NodeResizer
        color={currentColor.border}
        isVisible={selected}
        minWidth={120}
        minHeight={60}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
        }}
        lineStyle={{
          borderWidth: 1,
        }}
      />

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

          {/* 文字樣式按鈕 */}
          <button
            type="button"
            className={`node-text-style-btn ${showTextStyleEditor ? 'active' : ''}`}
            onClick={toggleTextStyleEditor}
            title="文字樣式"
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
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
          </button>

          {/* 站內連結按鈕 */}
          <button
            type="button"
            className={`node-link-btn ${currentLink ? 'has-link' : ''}`}
            onClick={toggleLinkEditor}
            title={currentLink ? '編輯站內連結' : '新增站內連結'}
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
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>

          {/* 外部連結（info）按鈕 */}
          <button
            type="button"
            className={`node-info-link-btn ${currentInfoLink ? 'has-link' : ''}`}
            onClick={toggleInfoLinkEditor}
            title={currentInfoLink ? '編輯外部連結' : '新增外部連結'}
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
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

      {/* 文字樣式編輯器 */}
      {showTextStyleEditor && (
        <div className="node-text-style-editor">
          {/* 字體大小 */}
          <div className="text-style-row">
            <label className="text-style-label">大小</label>
            <select
              className="font-size-select"
              value={currentTextStyle.fontSize || DEFAULT_TEXT_STYLE.fontSize}
              onChange={handleFontSizeChange}
              onClick={(e) => e.stopPropagation()}
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
          {/* 樣式按鈕 */}
          <div className="text-style-buttons">
            <button
              type="button"
              className={`style-btn bold-btn ${currentTextStyle.bold ? 'active' : ''}`}
              onClick={toggleBold}
              title="粗體"
            >
              B
            </button>
            <button
              type="button"
              className={`style-btn italic-btn ${currentTextStyle.italic ? 'active' : ''}`}
              onClick={toggleItalic}
              title="斜體"
            >
              I
            </button>
            <button
              type="button"
              className={`style-btn underline-btn ${currentTextStyle.underline ? 'active' : ''}`}
              onClick={toggleUnderline}
              title="底線"
            >
              U
            </button>
          </div>
          {/* 對齊按鈕 */}
          <div className="text-style-buttons align-buttons">
            <button
              type="button"
              className={`style-btn align-btn ${(currentTextStyle.textAlign || 'center') === 'left' ? 'active' : ''}`}
              onClick={setTextAlign('left')}
              title="靠左對齊"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="15" y2="12"></line>
                <line x1="3" y1="18" x2="18" y2="18"></line>
              </svg>
            </button>
            <button
              type="button"
              className={`style-btn align-btn ${(currentTextStyle.textAlign || 'center') === 'center' ? 'active' : ''}`}
              onClick={setTextAlign('center')}
              title="置中對齊"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="6" y1="12" x2="18" y2="12"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
            </button>
            <button
              type="button"
              className={`style-btn align-btn ${(currentTextStyle.textAlign || 'center') === 'right' ? 'active' : ''}`}
              onClick={setTextAlign('right')}
              title="靠右對齊"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="9" y1="12" x2="21" y2="12"></line>
                <line x1="6" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 站內連結編輯器 */}
      {showLinkEditor && (
        <div className="node-link-editor">
          <div className="link-editor-title">站內連結</div>
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="輸入站內連結 URL"
            className="link-input"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="link-actions">
            <button type="button" className="link-save-btn" onClick={handleLinkSave}>
              確定
            </button>
            {currentLink && (
              <button type="button" className="link-remove-btn" onClick={handleLinkRemove}>
                移除
              </button>
            )}
          </div>
        </div>
      )}

      {/* 外部連結編輯器 */}
      {showInfoLinkEditor && (
        <div className="node-link-editor info-link-editor">
          <div className="link-editor-title">外部連結 (另開分頁)</div>
          <input
            type="url"
            value={infoLinkValue}
            onChange={(e) => setInfoLinkValue(e.target.value)}
            placeholder="輸入外部連結 URL"
            className="link-input"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="link-actions">
            <button type="button" className="link-save-btn" onClick={handleInfoLinkSave}>
              確定
            </button>
            {currentInfoLink && (
              <button type="button" className="link-remove-btn" onClick={handleInfoLinkRemove}>
                移除
              </button>
            )}
          </div>
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

      <div
        className="node-content"
        onDoubleClick={handleDoubleClick}
        style={{
          textAlign: currentTextStyle.textAlign || DEFAULT_TEXT_STYLE.textAlign,
        }}
      >
        {isEditing ? (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="node-input node-textarea"
            autoFocus
            rows={3}
            placeholder="使用 *斜體* **粗體** ~~刪除線~~"
            style={{
              fontSize: currentTextStyle.fontSize || DEFAULT_TEXT_STYLE.fontSize,
              textAlign: currentTextStyle.textAlign || DEFAULT_TEXT_STYLE.textAlign,
            }}
          />
        ) : (
          <span
            className="node-label"
            style={{
              color: currentColor.text,
              fontSize: currentTextStyle.fontSize || DEFAULT_TEXT_STYLE.fontSize,
            }}
          >
            <RichText
              text={data?.label || '未命名'}
              baseStyle={{
                color: currentColor.text,
              }}
            />
          </span>
        )}
      </div>

      {/* 外部連結圖標 - 顯示在節點外部（下方） */}
      {currentInfoLink && (
        <div className="node-external-info-link">
          <a
            href={currentInfoLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            title={currentInfoLink}
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

export default memo(EditableNode)

