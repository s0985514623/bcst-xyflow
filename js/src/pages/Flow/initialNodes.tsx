import { Position } from '@xyflow/react'

export const initialNodes1 = [
    {
        id: 'n0',
        position: { x: 200, y: -100 },
        data: {
            label: 'First line therapy',
        },
        style: {
            backgroundColor: '#830050',
            color: '#ffffff',
        },
    },
    {
        id: 'n1',
        position: { x: 0, y: 0 },
        data: {
            label: 'Recurrence=>12 mo or no prior AI',
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: 'n2', position: { x: 0, y: 100 },
        data: {
            label: 'CDK4/6i + AI',
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: 'n3',
        position: { x: 150, y: 0 },
        data: {
            label: 'Recurrence < 12 mo or no prior AI',
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: 'n4', position: { x: 150, y: 100 },
        data: {
            label: (
                <div>
                    <div>CDK4/6i + AI</div>
                    <div>fulvestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: 'n5', position: { x: 300, y: -50 },
        data: {
            label: (
                <div>
                    <div>Biomarker-driven therapeutics</div>
                </div>
            ),
        },
        style: {
            width: 300,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: 'n6', position: { x: 300, y: 0 },
        data: {
            label: (
                <div>
                    <div>Plk3CA mutation</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: 'n7', position: { x: 300, y: 100 },
        data: {
            label: (
                <div>
                    <div>Inavolisib+palbociclib</div>
                    <div>+fulvestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: 'n8', position: { x: 450, y: 0 },
        data: {
            label: (
                <div>
                    <div>Plk3CA/AKT1/PTEN mutation</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: 'n9', position: { x: 450, y: 100 },
        data: {
            label: (
                <div>
                    <div>Capivasertlb + </div>
                    <div>fulvestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: 'n10', position: { x: -200, y: 200 },
        data: {
            label: (
                <div>
                    <div>ESR1+ mutation</div>
                    <div>detected from</div>
                    <div>liquid biopsy</div>
                </div>
            ),
        },
        sourcePosition: Position.Right,
        style: {
            width: 130,
            backgroundColor: 'transparent',
            border: 'none',
        },
    },
    {
        id: 'n11', position: { x: 0, y: 210 },
        data: {
            label: (
                <div>
                    <div>CDK4/6i + </div>
                    <div>camizestrant</div>
                </div>
            ),
        },
        targetPosition: Position.Left,
        style: {
            width: 130,
            backgroundColor: '#e991aa',
        },
    },
]

export const initialNodes2 = [
    {
        id: '2-n0',
        position: { x: 200, y: 300 },
        data: {
            label: '2nd line therapy',
        },
        style: {
            backgroundColor: '#830050',
            color: '#ffffff',
        },
    },
    {
        id: '2-n1',
        position: { x: 50, y: 350 },
        data: {
            label: 'if prior CDK4/6i',
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: '2-n2', position: { x:0, y: 450 },
        data: {
            label: (
                <div>
                    <div>CDK4/6i</div>
                    <div>rechallenge</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: '2-n3',
        position: { x: 150, y: 450 },
        data: {
            label: 'mTORi+fulvestrant',
        },
        style: {
            width: 130,
            backgroundColor: '#a1e1eb',
        },
    },
    {
        id: '2-n4', position: { x: 300, y: 350 },
        data: {
            label: (
                <div>
                    <div>PIK3CA mutation</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: '2-n5', position: { x: 300, y: 450 },
        data: {
            label: (
                <div>
                    <div>Alpelisib + </div>
                    <div>fulvestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: '2-n6', position: { x: 450, y: 350 },
        data: {
            label: (
                <div>
                    <div>Plk3CA/AKT1/PTEN</div>
                    <div>mutation</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: '2-n7', position: { x: 450, y: 450 },
        data: {
            label: (
                <div>
                    <div>Capivasertlb + </div>
                    <div>fulvestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
        sourcePosition: Position.Right,
    },
    {
        id: '2-n8', position: { x: 600, y: 350 },
        data: {
            label: (
                <div>
                    <div>ESR1 mutation</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: '2-n9', position: { x: 600, y: 450 },
        data: {
            label: (
                <div>
                    <div>imlunestrant</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: '#e0ec89',
        },
    },
    {
        id: '2-n10', position: { x: 550, y: 190 },
        data: {
            label: (
                <div>
                    <div>Recurrence on or</div>
                    <div>within 12 mos of</div>
                    <div>completing adjuvant</div>
                    <div>therapy</div>
                </div>
            ),
        },
        style: {
            width: 130,
            backgroundColor: 'transparent',
            border: 'none',
        },
    },
    {
        id: '2-n11',
        position: { x: -260, y: 420 },
        data: {
            label: 'T-DXd',
        },
        style: {
            width: 130,
            backgroundColor: '#fad193',
        },
    },
]

export const initialNodes3 = [
    {
        id: '3-n0',
        position: { x: 200, y: 550 },
        data: {
            label: '3rd line therapy',
        },
        style: {
            backgroundColor: '#830050',
            color: '#ffffff',
        },
    },
    {
        id: '3-n1',
        position: { x: 100, y: 650 },
        data: {
            label: 'T-DXd',
        },
        style: {
            width: 130,
            backgroundColor: '#fad193',
        },
        targetPosition: Position.Left,
    },
    {
        id: '3-n2',
        position: { x: 250, y: 650 },
        data: {
            label: 'chemotherapy',
        },
        style: {
            width: 130,
            backgroundColor: '#fad193',
        },
    },
    {
        id: '3-n3',
        position: { x: 250, y: 750 },
        data: {
            label: 'Dato-DXd',
        },
        style: {
            width: 130,
            backgroundColor: '#fad193',
        },
    },
    {
        id: '3-n4',
        position: { x: 400, y: 750 },
        data: {
            label: 'SG',
        },
        style: {
            width: 130,
            backgroundColor: '#fad193',
        },
    },
    {
        id: '3-n5',
        position: { x: -240, y: 500 },
        data: {
            label: (
                <div>
                    <div>－ Progression &lt;= 6 months of starting</div>
                    <div>first-line ET + CDK7/6i OR</div>
                    <div>－ Progression &lt;= 24 months of</div>
                    <div>starting adjuvant ET</div>
                </div>
            ),
        },
        style: {
            width: 200,
            backgroundColor: 'transparent',
            border: 'none',
        },
    },
]