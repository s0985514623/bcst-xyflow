import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUrl, postId } from '@/utils/env'
import type { FlowData, GetFlowResponse, SaveFlowResponse } from '@/types/flow'

const FLOW_QUERY_KEY = 'flow-data'

/**
 * Get API base URL with trailing slash
 */
const getApiBase = (): string => {
  const base = apiUrl || '/wp-json'
  return base.endsWith('/') ? base : `${base}/`
}

/**
 * Fetch flow data from WordPress REST API
 */
const fetchFlowData = async (id: string | number): Promise<GetFlowResponse> => {
  const response = await fetch(`${getApiBase()}bcst-xyflow/v1/flow/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': (window as any)?.wpApiSettings?.nonce || '',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch flow data')
  }

  return response.json()
}

/**
 * Save flow data to WordPress REST API
 */
const saveFlowData = async (params: {
  id: string | number
  flowData: FlowData
}): Promise<SaveFlowResponse> => {
  const { id, flowData } = params

  const response = await fetch(`${getApiBase()}bcst-xyflow/v1/flow/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': (window as any)?.wpApiSettings?.nonce || '',
    },
    body: JSON.stringify({ flow_data: flowData }),
  })

  if (!response.ok) {
    throw new Error('Failed to save flow data')
  }

  return response.json()
}

/**
 * Hook to get flow data
 */
export const useGetFlowData = (id?: string | number) => {
  const targetId = id || postId

  return useQuery({
    queryKey: [FLOW_QUERY_KEY, targetId],
    queryFn: () => fetchFlowData(targetId),
    enabled: !!targetId && targetId !== '0',
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to save flow data
 */
export const useSaveFlowData = (id?: string | number) => {
  const queryClient = useQueryClient()
  const targetId = id || postId

  return useMutation({
    mutationFn: (flowData: FlowData) =>
      saveFlowData({ id: targetId, flowData }),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: [FLOW_QUERY_KEY, targetId] })
    },
  })
}

export { FLOW_QUERY_KEY }

