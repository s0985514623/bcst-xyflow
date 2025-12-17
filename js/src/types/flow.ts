import type { Node, Edge, Viewport } from '@xyflow/react'

/**
 * Flow data structure stored in post meta
 */
export interface FlowData {
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport
}

/**
 * API response for getting flow data
 */
export interface GetFlowResponse {
  success: boolean
  data: {
    post_id: number
    flow_data: FlowData
  }
}

/**
 * API response for saving flow data
 */
export interface SaveFlowResponse {
  success: boolean
  message: string
  data: {
    post_id: number
    flow_data: FlowData
  }
}

/**
 * Request body for saving flow data
 */
export interface SaveFlowRequest {
  flow_data: FlowData
}

