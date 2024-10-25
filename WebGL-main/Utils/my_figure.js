const { cos, sin, sqrt, pow, PI } = Math

function CreateSurfaceData()
{
    let vertexList = [];

    const NUM_STEPS_u = 200,
        NUM_STEPS_T = 100,
        MAX_u = PI * 2,
        MAX_T = 5,
        STEP_u = MAX_u / NUM_STEPS_u,
        STEP_T = MAX_T / NUM_STEPS_T

    for (let u = 0; u < MAX_u; u += STEP_u) {
        for (let t = 0; t < MAX_T; t += STEP_T) {
            let vertex = ConicalEdgeVertex(t, u)
            vertexList.push(...vertex)
        }
    }

    return vertexList;
}

const a = 1
const b = 3
const c = 1

const scaler = 0.2;


function ConicalEdgeVertex(t, u) {

    let x = t * cos(u),
        y = t * sin(u),
        z = c*(a*a-b*b*cos(u)*cos(u));
    return [scaler * x, scaler * y, scaler * z];
}