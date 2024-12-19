const { cos, sin, sqrt, pow, PI } = Math

function CreateSurfaceData() {
    let uLines = [];
    let vLines = [];

    const NUM_STEPS_u = 30,
        NUM_STEPS_T = 30,
        MAX_u = Math.PI * 2,
        MAX_T = 5,
        STEP_u = MAX_u / NUM_STEPS_u,
        STEP_T = MAX_T / NUM_STEPS_T;

    // Generate U lines
    for (let u = 0; u <= MAX_u; u += STEP_u) {
        let uLine = [];
        for (let t = 0; t <= MAX_T; t += STEP_T) {
            let vertex = ConicalEdgeVertex(t, u);
            uLine.push(...vertex);
        }
        // Connect back to the first point for closed loop
        let firstVertex = ConicalEdgeVertex(0, u);
        uLine.push(...firstVertex);
        uLines.push(uLine);
    }

    // Generate V lines
    for (let t = 0; t <= MAX_T; t += STEP_T) {
        let vLine = [];
        for (let u = 0; u <= MAX_u; u += STEP_u) {
            let vertex = ConicalEdgeVertex(t, u);
            vLine.push(...vertex);
        }
        // Connect back to the first point for closed loop
        let firstVertex = ConicalEdgeVertex(t, 0);
        vLine.push(...firstVertex);
        vLines.push(vLine);
    }

    return { uLines, vLines };
}


function Model(name) {
    this.name = name;
    this.uBuffers = [];
    this.vBuffers = [];
    this.counts = [];

    this.BufferData = function(uLines, vLines) {
        const createBuffer = (lines) => {
            return lines.map(line => {
                let buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STREAM_DRAW);
                return { buffer, count: line.length / 3 };
            });
        };

        this.uBuffers = createBuffer(uLines);
        this.vBuffers = createBuffer(vLines);
    };

    this.Draw = function() {
        const drawLines = (buffers) => {
            buffers.forEach(({ buffer, count }) => {
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(shProgram.iAttribVertex);
                gl.drawArrays(gl.LINE_STRIP, 0, count);
            });
        };

        drawLines(this.uBuffers);
        drawLines(this.vBuffers);
    };
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");

    surface = new Model('Surface');
    const { uLines, vLines } = CreateSurfaceData();
    surface.BufferData(uLines, vLines);

    gl.enable(gl.DEPTH_TEST);
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