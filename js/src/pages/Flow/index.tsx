import { useCallback, useState } from 'react'
import {
    ReactFlow,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Connection,
    type NodeChange,
    type EdgeChange,
    type Node,
    type Edge,
    MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { initialNodes1, initialNodes2, initialNodes3 } from './initialNodes'

const initialNodes = [...initialNodes1, ...initialNodes2, ...initialNodes3]

const initialEdges = [
    {
        id: 'n1-n2',
        source: 'n1',
        target: 'n2',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: 'n3-n4',
        source: 'n3',
        target: 'n4',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: 'n6-n7',
        source: 'n6',
        target: 'n7',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: 'n8-n9',
        source: 'n8',
        target: 'n9',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: 'n2-n10',
        source: 'n2',
        target: 'n10',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
        style: {
            stroke: '#000000',      // 边颜色
            strokeWidth: 1,         // 边宽度
            strokeDasharray: '5,5', // 虚线样式
        }
    },
    {
        id: 'n10-n11',
        source: 'n10',
        target: 'n11',
        type: 'smoothstep',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
        style: {
            stroke: '#000000',      // 边颜色
            strokeWidth: 1,         // 边宽度
            strokeDasharray: '5,5', // 虚线样式
        }
    },
    {
        id: '2-n1-2-n2',
        source: '2-n1',
        target: '2-n2',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '2-n1-2-n3',
        source: '2-n1',
        target: '2-n3',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '2-n4-2-n5',
        source: '2-n4',
        target: '2-n5',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '2-n6-2-n7',
        source: '2-n6',
        target: '2-n7',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '2-n8-2-n9',
        source: '2-n8',
        target: '2-n9',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '2-n7-n9',
        source: '2-n7',
        target: 'n9',
        type: 'smoothstep',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
        style: {
            stroke: '#000000',      // 边颜色
            strokeWidth: 1,         // 边宽度
            strokeDasharray: '5,5', // 虚线样式
        }
    },
    {
        id: '3-n1-2-n11',
        source: '3-n1',
        target: '2-n11',
        type: 'smoothstep',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
        style: {
            stroke: '#000000',      // 边颜色
            strokeWidth: 1,         // 边宽度
            strokeDasharray: '5,5', // 虚线样式
        }
    },
    {
        id: '3-n2-3-n3',
        source: '3-n2',
        target: '3-n3',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
    {
        id: '3-n2-3-n4',
        source: '3-n2',
        target: '3-n4',
        // 箭頭標記
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#000000',
            width: 20,
            height: 20,
        },
    },
]

export default function Flow() {
    const [
        nodes,
        setNodes,
    ] = useState<Node[]>(initialNodes)
    const [
        edges,
        setEdges,
    ] = useState<Edge[]>(initialEdges)
    // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

    // 添加单个节点
    const addNewNode = () => {
        const newNode = {
            id: `node_${Date.now()}`, // 唯一ID
            type: 'default',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: '新节点' },
        }

        setNodes((prevNodes) => [...prevNodes, newNode])
    }

    const onNodesChange: (changes: NodeChange[]) => void = useCallback(
        (changes) => {
            console.log('onNodesChange', changes)
            setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot))
        },
        [setNodes],
    )
    const onEdgesChange: (changes: EdgeChange[]) => void = useCallback(
        (changes) => {
            console.log('onEdgesChange', changes)
            setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
        },
        [setEdges],
    )

    const onConnect: (params: Connection) => void = useCallback(
        (params: Connection) => {
            console.log('onConnect', params)
            setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot))
        },
        [],
    )

    return (
        <div style={{ width: '800px', height: '600px' }}>
            {/* <button onClick={addNewNode}>添加新节点</button> */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                // 這三個打開就等於可以進行編輯
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            />
        </div>
    )
}
