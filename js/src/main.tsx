import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { app1Selector, app2Selector } from '@/utils'
import { StyleProvider } from '@ant-design/cssinjs'

const App1 = React.lazy(() => import('./App1'))
const App2 = React.lazy(() => import('./App2'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
})

// 前台：支援短碼指定 post ID（class 選擇器）
const shortcodeNodes = document.querySelectorAll('.bcst-xyflow-shortcode')

// 前台：原本的 app1 選擇器（保持向後相容）
const app1Nodes = document.querySelectorAll(app1Selector)

// 後台：metabox 選擇器
const app2Nodes = document.querySelectorAll(app2Selector)

// 渲染短碼（支援指定 post ID）
if (shortcodeNodes.length > 0) {
  shortcodeNodes.forEach((el) => {
    const postId = el.getAttribute('data-post-id')
    ReactDOM.createRoot(el).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <StyleProvider hashPriority="high">
            <App1 postId={postId ? parseInt(postId, 10) : undefined} />
          </StyleProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </React.StrictMode>,
    )
  })
}

// 渲染原本的 app1（向後相容）
if (app1Nodes.length > 0) {
  app1Nodes.forEach((el) => {
    // 檢查是否已經被短碼渲染過
    if (el.classList.contains('bcst-xyflow-shortcode')) return

    ReactDOM.createRoot(el).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <StyleProvider hashPriority="high">
            <App1 />
          </StyleProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </React.StrictMode>,
    )
  })
}

// 渲染後台 metabox
if (app2Nodes.length > 0) {
  app2Nodes.forEach((el) => {
    ReactDOM.createRoot(el).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <StyleProvider hashPriority="high">
            <App2 />
          </StyleProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </React.StrictMode>,
    )
  })
}
