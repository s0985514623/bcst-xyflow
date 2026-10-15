import '@/assets/scss/index.scss'
import Flow from './pages/Flow'

interface App1Props {
  postId?: number
  autoHeight?: boolean
}

/**
 * App1 - 前台顯示（只讀模式）
 *
 * @param {App1Props} props              - 組件屬性
 * @param {number}    [props.postId]     - 可選的 post ID，若未提供則使用全域設定
 * @param {boolean}   [props.autoHeight] - 畫布高度是否依流程圖比例自動決定
 */
function App1({ postId, autoHeight }: App1Props) {
  return <Flow readOnly postId={postId} autoHeight={autoHeight} />
}

export default App1
